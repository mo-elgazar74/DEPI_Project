# 📚 Arabic Educational Chatbot - RAG Pipeline (LlamaIndex)

This project allows you to extract Arabic text from educational PDFs and ask natural language questions about them using a local RAG (Retrieval-Augmented Generation) pipeline built with **LlamaIndex**.

---

## 🧱 Project Structure

```
DEPI_Project/
├── Books/
│   ├── Books/                      # Raw input PDFs
│   └── Maths_grade_5_first_term.pdf
│
│
├── index_math_g5/                 # LlamaIndex FAISS vector index (auto-generated)
│   ├── docstore.json
│   ├── index_store.json
│   └── vector_store.faiss
│
├── build_index.py                 # Builds the vector index from JSONL
├── ask.py                         # Run this to ask questions!
├── README.md                      # This file
└── requirements.txt               # Required libraries
```

---

## ✅ 1. Prepare Your Environment (Conda Recommended) (Optional)

```bash
conda create -n edu_bot python=3.10 -y
conda activate edu_bot
pip install -r requirements.txt
```

---

## 📥 2. Put Your PDF(s)

Place your Arabic educational PDFs inside the folder:

```
Books/Books/
```

---

## 📥 3. Install Requirements

Run this in your terminal in project folder:

```
Books/Books/pip install -r requirements.txt
```

---

## 🧾 4. Extract Text from PDF

Use the OCR extraction script (lightweight, optimized):

```bash
python extract_and_clean.py  # Or your version
```

It will generate a file like:

```
Books/Books/Maths_grade_5_first_term_clean_chunked.jsonl
```

---

## 🏗️ 5. Build the Vector Index

```bash
python build_index.py
```

This will:
- Load the cleaned chunks
- Generate embeddings with `intfloat/multilingual-e5-small`
- Build a FAISS index
- Save everything inside `index_math_g5/`

---

## ❓ 6. Ask Questions (RAG)

```bash
python ask.py
```

Then type your question in Arabic, like:

```
Question Realted to your grade ?
```

---

## 💡 Notes

- The index is **language-aware**, so Arabic questions will work.
- No LLM (like GPT) is used by default — just retrieval.
- You can later plug in OpenAI, Mistral, or other models.

---

## 🤝 Credits

Built with:
- LlamaIndex
- HuggingFace Embeddings
- FAISS for vector storage