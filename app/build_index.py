# build_index.py
import os
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"

from pathlib import Path
import json
from typing import List

from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.faiss import FaissVectorStore
import faiss

INPUT_JSONL = "/home/mohamed/DEPI_Project/Data/Extracted_Books/Cleaned/maths/g5/t1/Maths_grade_5_first_term_clean_chunked.jsonl"
INDEX_DIR   = "/home/mohamed/DEPI_Project/Indexes/maths/g5/t1/index_math_g5_t1"

def load_jsonl_chunks(path: str):
    docs = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            text = (obj.get("text") or "").strip()
            md   = obj.get("metadata", {}) or {}
            if text:
                docs.append(Document(text=text, metadata=md))
    return docs

def main():
    in_path = Path(INPUT_JSONL)
    if not in_path.exists():
        print("❌ Input file dosen't exist.", in_path); return

    # 1) Embedding ( cosine Similarity)
    embed = HuggingFaceEmbedding(model_name="intfloat/multilingual-e5-small", normalize=True)
    Settings.embed_model = embed

    # 2) Faiss Index
    dim = len(embed.get_query_embedding("hello"))
    faiss_index = faiss.IndexFlatIP(dim)  # IP مع normalize=True ≈ cosine

    # 3) Prepare VectorStore
    vector_store = FaissVectorStore(faiss_index=faiss_index)

    # 4) StorageContext 
    storage_ctx  = StorageContext.from_defaults(vector_store=vector_store)

    print("📥 Building Chunks ...")
    docs = load_jsonl_chunks(str(in_path))
    print(f"✅ loading done for : {len(docs)} Chunks.")

    print("🏗️  Building Vector Store (FAISS) ...")
    index = VectorStoreIndex.from_documents(docs, storage_context=storage_ctx, show_progress=True)

    print("💾 Saving Vector Store (FAISS)...")
    Path(INDEX_DIR).mkdir(parents=True, exist_ok=True)
    index.storage_context.persist(persist_dir=INDEX_DIR)
    print(f"✅ Saved in: {INDEX_DIR}")

if __name__ == "__main__":
    main()
