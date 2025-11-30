# Edu_Bot – Arabic Curriculum Agentic RAG

Edu_Bot turns Ministry of Education PDFs into an Arabic-first tutoring assistant. It combines a classic RAG path and a deeper “agentic” mode that can chain retrieval, web search, vision, and memory to answer students in an Ali5 style. The repo also ships an optional full-stack web experience (Express + Clerk + Vite) and voice features (Groq TTS/STT).

---

## What’s Inside
- **Python AI service (`app/`)** – Extraction/cleaning, vector DB build, RAG + agentic LangGraph pipelines, Flask API, Groq TTS/STT.
- **Vector store + data** – Extracted JSON chunks under `Data/`, Qdrant collections per subject/grade/term, optional FAISS legacy indexes.
- **Full-stack shell (`website/`)** – Express proxy with Clerk auth/guest limits + Vite/React client with chat, dashboards, and voice hooks.
- **Docker Compose** – One command to bring up the client, Express proxy, and AI Flask service.
- **Runtime storage** – `chats/` (saved conversations), `memory_store/` (student memory summaries), `logs/` (API calls).

---

## Repository Map
```
app/                 # AI stack: RAG/Agentic pipelines, Flask API, build scripts, Dockerfile
Data/                # Raw PDFs + extracted JSON chunks
memory_store/, chats/ # Persistent student memory + chat history
website/
  server/            # Express + Clerk proxy to Flask (auth, rate limits, voice proxy)
  client/            # Vite + Clerk front-end
docker-compose.yml   # Compose for client + server + AI service
```

---

## Prerequisites
- Python 3.11+
- Node 20+ and npm (for the web stack)
- Docker/Docker Compose (optional, for the all-in-one run)
- Qdrant instance reachable via `URL_QDRANT` and `API_KEY_QDRANT`
- Hugging Face token for embeddings (`intfloat/multilingual-e5-large`)
- Groq API key for text LLMs and playai TTS/STT (fallbacks to DeepSeek/OpenRouter when set)
- Tesseract OCR binary installed and on `PATH` (for PDF extraction)
- Optional: Tavily API key for web search in agentic mode, OpenRouter token for vision/Qwen, DeepSeek key for LLM fallback

---

## Environment Variables

### Root `.env` (AI/RAG service)
```
# Core LLMs
GROQ_API_KEY=...
GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_CHAT_MODEL=deepseek-chat

# Embeddings + Vector DB
HUGGINGFACEHUB_API_TOKEN=...
URL_QDRANT=https://your-qdrant
API_KEY_QDRANT=...

# Vision / OpenRouter (optional)
OPENROUTER_API_KEY=...
OPENROUTER_BASE=https://openrouter.ai/api/v1
OPENROUTER_VISION_MODEL=meta-llama/llama-3.2-90b-vision-instruct
OPENROUTER_BACKUP_VISION_MODEL=qwen/qwen-vl-plus
OPENROUTER_REFERER=...
OPENROUTER_TITLE=EduBot

# Web search (agentic mode)
TAVILY_API_KEY=...

# Voice (Groq playai TTS/STT)
GROQ_TTS_STT_API_KEY=...   # falls back to GROQ_API_KEY if absent
```

### `website/server/.env` (Express + Clerk proxy)
```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
CLERK_SECRET_KEY=sk_test_or_live
FLASK_API_BASE=http://localhost:8000
EDUBOT_GUEST_LIMIT=5
```

### `website/client/.env.local` (Vite + Clerk)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_or_live
VITE_API_BASE=http://localhost:4000
# Optional voice + live-calls
VITE_ELEVENLABS_API_KEY=...
VITE_ELEVENLABS_VOICE_ID=...
VITE_VAPI_PUBLIC_KEY=...
VITE_VAPI_ASSISTANT_ID=...
```

---

## Setup & Run

### 1) AI service only (Python)
```bash
cd app
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# create ../.env with the variables above

# (Optional) ingest data
python extract_books.py    # parses PDFs → Data/Extracted_Books/...
python build_db.py         # embeds and upserts to Qdrant

# Run the Flask API
python app_flask.py        # http://localhost:8000
```
Quick CLI test without the web stack:
```bash
python - <<'PY'
from main import run_agentic_pipeline
print(run_agentic_pipeline("اشرح لي كيفية ضرب الكسور للصف الخامس", {"grade":"5","term":"1","name":"Omar"}))
PY
```

### 2) Full stack (Flask + Express + Vite)
```bash
# Terminal 1: AI service
cd app && source .venv/bin/activate && python app_flask.py

# Terminal 2: Express proxy (Clerk auth + guest limits)
cd website/server
npm install
npm run dev     # http://localhost:4000

# Terminal 3: React client
cd website/client
npm install
npm run dev     # http://localhost:5173
```

### 3) Docker Compose
Ensure `.env`, `website/server/.env`, and `website/client/.env` exist, then:
```bash
docker compose up --build
```
This starts:
- `ai-service` → Flask on `:8000`
- `backend` → Express proxy on `:4000`
- `frontend` → Nginx-served Vite build on `:5173`

---

## RAG & Agentic Pipelines
- **Standard RAG (`rag.py`)**: grade/term-aware retrieval from Qdrant, optional image description (vision via OpenRouter), student memory injection, and Groq/DeepSeek text generation.
- **Agentic RAG (`agentic_rag.py`)**: LangGraph plan with memory loading, optional vision description, subject/collection selection, iterative retrieval with metadata filters, optional Tavily web search, answer drafting + confidence loop, and memory updates.
- **Entry point**: `run_agentic_pipeline(question, student_meta, mode_flag=0|1, web_search_flag=0|1, image_base64=None)` in `app/main.py`. `mode_flag=1` or `web_search_flag=1` forces the agentic path.
- **Embeddings**: `intfloat/multilingual-e5-large` via Hugging Face endpoint.
- **Vector store**: Qdrant collections named by subject/grade/term (e.g., `math_g5_t1`). Extracted chunks live in `Data/Extracted_Books/<subject>/<grade>/<term>/*.json`.
- **Vision**: When `image_base64` is provided, the agent first asks the vision model for a concise description and blends it into the search query.
- **Memory**: Per-student summaries saved under `memory_store/<name>.json`, updated after each answer.

---

## Flask API (AI service)
- `POST /api/ask` – Single-turn Q&A. Body: `question`, optional `image_base64`, `student_meta`, `mode_flag` (0=RAG, 1=Agentic), `web_search_flag` (1 forces agentic).
- `POST /api/chat/new` → create chat; `GET /api/chats` → list; `GET/DELETE /api/chat/:id`; `POST /api/chat/:id/ask` → multi-turn with history and memory updates.
- `POST /api/voice_question` – Text from STT, runs the agent, returns answer.
- `POST /api/tts?stream=1` – Groq playai Arabic TTS (streamed or single file). Body: `text`, optional `voice`.
- `POST /api/stt` – Groq Whisper STT (multipart `audio` file).
- `POST /api/live` – Helper for Vapi live-call sessions (forwarded by Express).
Headers: `X-User-Id` is honored to separate chat/memory storage per user; defaults to `local`.

---

## Express Proxy (`website/server`)
- Wraps the Flask API with Clerk authentication, guest limits (`EDUBOT_GUEST_LIMIT`), and cookie-based guest IDs.
- Routes mirror the Flask endpoints under `/api/rag/*` (e.g., `/api/rag/ask`, `/api/rag/chat/:id/ask`, `/api/rag/tts`, `/api/rag/stt`).
- Normalizes student metadata from Clerk profiles and ensures grade/term defaults for guests.

---

## React Client (`website/client`)
- Vite + Clerk-authenticated UI with chat, dashboards, OTP/email login, and mic controls.
- Uses the Express proxy for all calls; configure `VITE_API_BASE` and Clerk keys.
- Voice: integrates ElevenLabs (TTS playback) and optional Vapi live-call card when keys are present.
- Build: `npm run build` → static assets served by Nginx in the Docker image.

---

## Data Pipeline Notes
1) **Extract PDFs**: place PDFs under `Data/` and run `python app/extract_books.py`. Outputs chunked JSON with metadata (`subject`, `grade`, `term`, `page`, `chunk_id`, math/diagram hints).
2) **Build Qdrant**: run `python app/build_db.py` to embed chunks and upsert to collections. Re-run after adding content or changing the embedding model.
3) **Validation**: use `python -m app.deploy` or the Flask `/api/ask` endpoint to sanity-check retrieval.

---

## Storage & Logs
- Chats: `chats/<user_id>/<chat_id>.json`
- Memory: `memory_store/<name>.json`
- Logs: `logs/api_requests.log`
- Temp audio (TTS/STT): cleaned up after each request

---

## Troubleshooting
- Qdrant dimension errors → rebuild with `build_db.py` after changing embeddings.
- Blank answers with images → confirm `OPENROUTER_API_KEY` and `OPENROUTER_VISION_MODEL` are set.
- OCR misses math-heavy PDFs → ensure `tesseract` is installed and accessible; rerun `extract_books.py`.
- Clerk errors → verify `CLERK_SECRET_KEY`/`VITE_CLERK_PUBLISHABLE_KEY` and allowed origins.
- Guest usage capped → bump `EDUBOT_GUEST_LIMIT` or sign in via Clerk.
