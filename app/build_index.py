# build_index.py
import os
import json
import uuid
from pathlib import Path
from typing import List
os.environ["TRANSFORMERS_NO_TF"] = "1"  
os.environ["USE_TF"] = "0"              
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams
from llama_index.core import Document, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# ========= ENV & CLIENT =========
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
CLEANED_ROOT = "/home/mohamed/DEPI_Project/Data/Extracted_Books/Cleaned"
VECTOR_DIM   = 384

def _safe_create_collection(collection_name: str, recreate: bool) -> None:
    """
    Creates or recreates a Qdrant collection with the given name.
    If recreate is True, it will delete any existing collection with the same name.
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
        pass  # Collection already exists


def insert_into_qdart(recreate: bool = False) -> None:
    """
    Goes into every JSONL file under CLEANED_ROOT:
    - determines collection name: subject_grade_term
    - creates/recreates the collection
    - builds points with stable id (source-page-chunk_id)
    - upserts all points into the collection
    """
    root = Path(CLEANED_ROOT)
    files = list(root.rglob("*.jsonl"))
    if not files:
        print(f"❌ No JSONL files found under: {root}")
        return

    for jsonl_file in files:
        # subject/grade/term from path: .../Cleaned/<subject>/<grade>/<term>/<file.jsonl>
        try:
            subject = jsonl_file.parts[-4]
            grade   = jsonl_file.parts[-3]
            term    = jsonl_file.parts[-2]
        except Exception:
            subject, grade, term = "general", "na", "na"

        collection_name = f"{subject}_{grade}_{term}"
        _safe_create_collection(collection_name, recreate=recreate)

        points: List[PointStruct] = []

        with open(jsonl_file, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue

                text = (obj.get("text") or "").strip()
                md   = (obj.get("metadata") or {})
                if not (text and md):
                    continue
                vector = EMBED_MODEL.get_text_embedding(text)
                # Add text to payload for reference
                md["text"] = text
                # Stable ID based on source|page|chunk_id
                raw_id = f"{md.get('source','src')}|{md.get('page', i)}|{md.get('chunk_id', i)}"
                point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, raw_id))
                points.append(PointStruct(id=point_id, vector=vector, payload=md))

        if points:
            QDRANT_CLIENT.upsert(collection_name=collection_name, points=points)
            print(f"✅ Upsert {len(points)} point(s) → {collection_name}  (from {jsonl_file.name})")

    # Clooections Names
    print("\n📚 Collections:")
    cols = QDRANT_CLIENT.get_collections()
    for c in cols.collections:
        print(" •", c.name)


if __name__ == "__main__":
    # If collection exists, it will be recreated (all data lost)
    insert_into_qdart(recreate=False)

