# build_db.py
import os
import json
import uuid
from pathlib import Path
from typing import List

# تقليل ضوضاء TensorFlow/Transformers
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# ========= ENV & CLIENT =========
# عدّل المسار لو ملف .env في مكان مختلف
load_dotenv("/home/mohamed/DEPI_Project/.env")

URL_QDRANT = os.getenv("URL_QDRANT")
API_KEY_QDRANT = os.getenv("API_KEY_QDRANT")
if not URL_QDRANT or not API_KEY_QDRANT:
    raise EnvironmentError("❌ Set URL_QDRANT and API_KEY_QDRANT in environment.")

QDRANT_CLIENT = QdrantClient(url=URL_QDRANT, api_key=API_KEY_QDRANT)

# ========= MODEL =========
# intfloat/multilingual-e5-small -> 384-dim
EMBED_MODEL = HuggingFaceEmbedding(model_name="intfloat/multilingual-e5-small", normalize=True)
Settings.embed_model = EMBED_MODEL

# ========= CONFIG =========
CLEANED_ROOT = "/home/mohamed/DEPI_Project/Data/Extracted_Books"
VECTOR_DIM   = 384
BATCH_SIZE   = 256  

def _safe_create_collection(collection_name: str, recreate: bool) -> None:
    """
    إنشاء/إعادة إنشاء كولكشن في Qdrant.
    لو recreate=True هيحذف الكولكشن القديمة ويعمل واحدة جديدة.
    """
    if recreate:
        QDRANT_CLIENT.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
        )
        return
    try:
        QDRANT_CLIENT.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
        )
    except Exception:
        # موجودة بالفعل
        pass


def iterate_records_from_file(json_file: Path):
    """
    قارئ عام يدعم:
      - JSON (list/dict) -> اللي بيطلع من extract_books.py
      - JSONL (سطر لكل كائن)
    بيرجع كائنات { "text": ..., "metadata": {...} }
    """
    with open(json_file, "r", encoding="utf-8") as f:
        # جرّب JSON كامل (array/dict)
        try:
            data = json.load(f)
            if isinstance(data, list):
                for obj in data:
                    if isinstance(obj, dict):
                        yield obj
            elif isinstance(data, dict):
                # ملف فيه سجل واحد
                yield data
            return
        except Exception:
            # لو فشل يبقى يمكن JSONL
            f.seek(0)
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if isinstance(obj, dict):
                        yield obj
                except Exception:
                    # سطر غير صالح → تجاهل
                    continue


def _upsert_points_in_batches(collection_name: str, points: List[PointStruct]):
    """رفع النقاط على دفعات لتحسين الذاكرة والأداء."""
    if not points:
        return
    for i in range(0, len(points), BATCH_SIZE):
        batch = points[i:i + BATCH_SIZE]
        QDRANT_CLIENT.upsert(collection_name=collection_name, points=batch)


def insert_into_qdart(recreate: bool = False) -> None:
    """
    يمر على كل ملفات JSON/JSONL تحت CLEANED_ROOT:
      - يستنتج اسم الكولكشن: subject_grade_term
      - ينشئ الكولكشن لو مش موجودة (أو يعيد إنشائها لو recreate=True)
      - يبني النقاط (id ثابت من source|page|chunk_id)
      - يرفعها إلى Qdrant
    """
    root = Path(CLEANED_ROOT)
    files = list(root.rglob("*.json")) + list(root.rglob("*.jsonl"))
    if not files:
        print(f"❌ No JSON/JSONL files found under: {root}")
        return

    for json_file in files:
        # subject/grade/term من المسار: .../Extracted_Books/<subject>/<grade>/<term>/<file.json>
        try:
            subject = json_file.parts[-4]
            grade   = json_file.parts[-3]
            term    = json_file.parts[-2]
        except Exception:
            subject, grade, term = "general", "na", "na"
        
        collection_name = f"{subject}_{grade}_{term}"
        _safe_create_collection(collection_name, recreate=recreate)
        count_points = 0
        buffer: List[PointStruct] = []

        for i, obj in enumerate(iterate_records_from_file(json_file)):
            try:
                text = (obj.get("text") or "").strip()
                md   = (obj.get("metadata") or {})
                if not (text and isinstance(md, dict) and md):
                    continue
                vector = EMBED_MODEL.get_text_embedding(text)
                md["text"] = text
                raw_id = f"{md.get('source','src')}|{md.get('page', i)}|{md.get('chunk_id', i)}"
                point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, raw_id))

                buffer.append(PointStruct(id=point_id, vector=vector, payload=md))
                count_points += 1

                if len(buffer) >= BATCH_SIZE:
                    _upsert_points_in_batches(collection_name, buffer)
                    buffer.clear()

            except Exception as e:
                print(f"⚠️ Skipped bad record in {json_file.name}: {e}")
                continue

        if buffer:
            _upsert_points_in_batches(collection_name, buffer)

        print(f"✅ Upsert {count_points} point(s) → {collection_name}  (from {json_file.name})")

    # عرض أسماء الكولكشن
    print("\n📚 Collections:")
    cols = QDRANT_CLIENT.get_collections()
    for c in cols.collections:
        print(" •", c.name)


if __name__ == "__main__":
    # لو عايز تمسح أي بيانات قديمة وتعيد الإنشاء: خليها True
    insert_into_qdart(recreate=False)
