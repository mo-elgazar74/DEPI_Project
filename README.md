# 📚 Edu_Bot – Arabic Educational Chatbot (RAG with LlamaIndex)

An Arabic-first RAG pipeline for Egyptian primary-school content.  
It extracts text from PDFs, cleans & chunks it, builds a FAISS vector index, and answers questions in a kid-friendly **Ali5** style (explain like to a 5-year-old) using **Groq** LLMs.

---

## ✅ Current Status

- End-to-end pipeline completed for **Maths → Grade 5 → Term 1**:
  - PDF → JSONL (raw)
  - Cleaned/Chunked JSONL → **FAISS** index
  - CLI **Q&A** (`app/ask.py`) with **Ali5** system prompt (Arabic), optional reranker
- Repository structure is ready to scale to more **subjects/grades/terms**

---

## 🗂️ Project Structure

```
DEPI_Project/
├── app/
│   ├── ask.py                 # CLI Q&A (RAG + Ali5 prompt)
│   ├── build_index.py         # Build FAISS index from cleaned JSONL
│   ├── cleaning.py            # Clean & chunk extracted text
│   └── extract_edu_pdf.py     # PDF → JSONL (raw)
├── Data/
│   ├── Books/
│   │   └── Maths_grade_5_first_term.pdf
│   └── Extracted_Books/
│       ├── Basic/
│       │   └── Maths_grade_5_first_term.jsonl
│       └── Cleaned/
│           └── Maths_grade_5_first_term_clean_chunked.jsonl
├── Indexes/
│   └── maths/
│       └── g5/
│           ├── t1/
│           │   └── index_math_g5_t1/
│           │       ├── default__vector_store.json
│           │       ├── docstore.json
│           │       ├── graph_store.json
│           │       ├── image__vector_store.json
│           │       └── index_store.json
│           └── t2/
├── LICENSE
├── README.md
└── requirements.txt
```

> **Naming convention (scalable):** `Indexes/<subject>/<grade>/<term>/index_<subject>_<grade>_<term>/`

---

## 🧰 Requirements

- Python **3.10+** (Conda recommended)
- A **Groq API key** (for LLM answers) — get it here: **https://console.groq.com/keys**
- `pip install -r requirements.txt`

> The code disables TensorFlow via environment variables to avoid TF/NumPy conflicts.

---

## ⚙️ Setup

### 1) Create and activate the environment
```bash
conda create -n edu_bot python=3.12 -y
conda activate edu_bot
pip install -r requirements.txt
```

### 2) Create a `.env` in the project root
```ini
# Groq
GROQ_API_KEY=YOUR_GROQ_KEY_HERE
GROQ_API_BASE=https://api.groq.com/openai/v1
# Faster for short answers: llama-3.1-8b-instant | More capable: llama-3.3-70b-versatile
GROQ_MODEL=llama-3.3-70b-versatile

# Index path (adjust to your machine)
INDEX_DIR=/home/mohamed/DEPI_Project/Indexes/maths/g5/t1/index_math_g5_t1

# Retrieval
TOP_K=8          # number of chunks retrieved from FAISS before postprocessing
USE_RERANK=1     # 1 = enable cross-encoder reranker (slower), 0 = disable (faster)
```

---

## 📤 Data Flow (Pipeline)

1) **Extract PDF → JSONL (Basic)**  
   Script: `app/extract_edu_pdf.py`  
   Output: `Data/Extracted_Books/Basic/*.jsonl`

2) **Clean & Chunk JSONL**  
   Script: `app/cleaning.py`  
   Output: `Data/Extracted_Books/Cleaned/*_clean_chunked.jsonl`

3) **Build FAISS Index**  
   Script: `app/build_index.py`  
   Uses HuggingFace embeddings + FAISS (cosine/IP)  
   Output: `Indexes/.../index_*/*`

4) **Q&A (RAG + Ali5)**  
   Script: `app/ask.py`  
   Arabic Ali5 prompt + optional reranker + Groq LLM

---

## 🏗️ Build the Index

```bash
conda run --live-stream -n edu_bot python app/build_index.py
```

> 🔔 **Important:** If you **change the embedding model**, you **must rebuild the index** so FAISS dimensions match.

---

## ❓ Ask Questions (CLI)

```bash
conda run --live-stream -n edu_bot python app/ask.py
```

- Type your question in **Arabic** (press `q` to quit).
- The **Ali5** system prompt ensures child-friendly explanations (short sentences, simple words, steps & small examples).
- The CLI also prints **source chunks** (page/subject/grade/score).

**Current defaults in code:**
- `build_index.py`: uses multilingual E5 embeddings (base) to build the vector store.
- `app/ask.py`: uses multilingual E5 (small) for querying + optional cross-encoder reranker.

> To avoid dimension issues, keep the **same embedding family** across build and ask, or rebuild the index after changes.

---

## 🧪 Team Playbook (step-by-step)

1) `conda activate edu_bot`  
2) Confirm `.env` has a valid `GROQ_API_KEY` and the correct `INDEX_DIR`.  
3) If you plan to change the embedding model, **rebuild the index** afterwards.  
4) Build the index:
   ```bash
   conda run --live-stream -n edu_bot python app/build_index.py
   ```
5) Run Q&A:
   ```bash
   conda run --live-stream -n edu_bot python app/ask.py
   ```
6) If slow:
   - Set `USE_RERANK=0` in `.env` (skips cross-encoder)
   - Try `GROQ_MODEL=llama-3.1-8b-instant`
   - Lower `TOP_K` (e.g., 6)

---

## 🔧 Tips & Tuning

- **Faster responses:** `USE_RERANK=0` and `TOP_K=6`.  
- **Longer answers:** Increase `TOP_K` to 6–10; consider switching `response_mode` to `"simple_summarize"` in `ask.py`.  
- **Arabic reranker:** Prefer **`BAAI/bge-reranker-v2-m3`** (multilingual) over MiniLM if you need a reranker; install extras below.  
- **Scaling:** Follow the folder convention for new subjects/grades/terms; later we can move to a cloud vector DB (Pinecone/Qdrant/Azure) and route by `{subject, grade, term}` metadata.

---

## 🛠️ Troubleshooting

- **FAISS error `assert d == self.d`**  
  Embedding dimension mismatch.  
  → Rebuild the index after changing the embedding model.

- **Slow responses**  
  Cross-encoder reranker is heavy on CPU.  
  → Set `USE_RERANK=0`, reduce `TOP_K`, or use `llama-3.1-8b-instant`.

- **ImportError: `einops` / TF / NumPy**  
  Install missing deps:
  ```bash
  pip install -U einops sentence-transformers transformers safetensors
  ```
  (The scripts also disable TensorFlow via env vars at the top.)

- **Ali5 style not followed**  
  Ensure Groq is active (LLM not disabled) and consider a summarize response mode for clearer/longer outputs.

---

## 📝 License

See `LICENSE` in the project root.
