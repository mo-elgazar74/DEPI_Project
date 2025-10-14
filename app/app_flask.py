import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from flask import Flask, request, jsonify
from flask_cors import CORS

from deploy import run_agent
from rag_kpi_report import build_kpi_report

# ==========================================================
# 🔹 Flask Setup
# ==========================================================
app = Flask(__name__, template_folder="templates")
CORS(app)

# ==========================================================
# 🔹 Meta Data
# ==========================================================
STUDENT_META = {
    "grade": "5",
    "term": "1",
    "name": "Omar",
    "age": "11",
}


def normalize_student_meta(meta: dict | None) -> dict:
    merged = dict(STUDENT_META)
    if isinstance(meta, dict):
        for key, value in meta.items():
            if value is None:
                continue
            merged[key] = str(value)

    grade_raw = str(merged.get("grade", "5"))
    if grade_raw.lower().startswith("g"):
        grade_raw = grade_raw[1:]
    merged["grade"] = grade_raw or "5"

    term_raw = str(merged.get("term", "1"))
    merged["term"] = term_raw or "1"

    name_raw = str(merged.get("name", "Omar")).strip() or "Omar"
    merged["name"] = name_raw

    age_raw = str(merged.get("age", "11"))
    merged["age"] = age_raw or "11"

    return merged

# ==========================================================
# 🔹 Logs
# ==========================================================
LOG_DIR = Path("logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "api_requests.log"


def log_request(payload: dict) -> None:
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **payload,
    }
    with LOG_FILE.open("a", encoding="utf-8") as fp:
        fp.write(json.dumps(entry, ensure_ascii=False) + "\n")


# ==========================================================
# 🔹 Conversations Folder
# # ==========================================================
CHATS_DIR = Path("chats")
CHATS_DIR.mkdir(parents=True, exist_ok=True)


def _user_dir(user_id: str) -> Path:
    d = CHATS_DIR / user_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _chat_path(user_id: str, chat_id: str) -> Path:
    return _user_dir(user_id) / f"{chat_id}.json"


def load_chat(user_id: str, chat_id: str) -> dict:
    p = _chat_path(user_id, chat_id)
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def save_chat_atomic(user_id: str, chat: dict) -> None:
    p = _chat_path(user_id, chat["chat_id"])
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(chat, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, p)


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def make_title_from_first_utterance(text: str) -> str:
    t = (text or "").strip().replace("\n", " ")
    if not t:
        return "New Chat"
    return (t[:50] + "…") if len(t) > 50 else t


def update_summary(old_summary: str, user_content: str, assistant_content: str) -> str:
    parts: List[str] = []
    if old_summary:
        parts.append(old_summary.strip())
    if user_content:
        parts.append(f"آخر سؤال: {user_content.strip()[:200]}")
    if assistant_content:
        parts.append(f"أجاب المساعد بإيجاز: {assistant_content.strip()[:250]}")
    merged = " | ".join(parts)
    return merged[:500]


def build_context(chat: dict, question: str) -> str:
    MAX_CHARS = 3500
    summary = (chat.get("summary") or "").strip()
    messages = chat.get("messages", [])
    recent = messages[-6:]

    dialogue_lines: List[str] = []
    for msg in recent:
        role = msg.get("role", "user")
        content = (msg.get("content") or "").strip()
        dialogue_lines.append(f"{role}: {content}")

    base = [question.strip()]

    context_notes: List[str] = []
    if summary:
        context_notes.append("[خلاصة المحادثة]\n" + summary)

    if dialogue_lines:
        context_notes.append("[أحدث تفاعل]\n" + "\n".join(dialogue_lines))

    context_notes.append(
        "[تعليمات المساعد]\nوضع Ali5: اشرح كما لو كنت تتحدث مع طفل عمره 5 سنوات، واعتمد فقط على المعلومات المرفقة."
    )

    context = "\n\n".join(base + context_notes)
    if len(context) > MAX_CHARS:
        context = context[-MAX_CHARS:]
    return context


def run_rag(question: str, student_meta: dict | None = None, context: str | None = None):
    meta = normalize_student_meta(student_meta)
    return run_agent(question, meta, context)


def _get_user_id() -> str:
    return (request.headers.get("X-User-Id") or "local").strip() or "local"


def _require_chat(user_id: str, chat_id: str) -> dict:
    chat = load_chat(user_id, chat_id)
    if not chat:
        raise FileNotFoundError("chat_not_found")
    return chat


# ==========================================================
# 🔹 Routes
# ==========================================================
@app.post("/api/ask")
def api_ask():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    student_meta = normalize_student_meta(data.get("student_meta"))

    if not question:
        return jsonify({
            "status": "error",
            "message": "يرجى إرسال السؤال في الحقل 'question'."
        })

    try:
        result = run_rag(question, student_meta)
        response = {
            "status": "ok",
            "question": question,
            "answer": result.get("answer", ""),
            "confidence": result.get("confidence", 0.0),
            "reasoning": result.get("reasoning", ""),
            "summary": result.get("summary", ""),
            "student_meta": student_meta,
        }
        log_request({
            "question": question,
            "confidence": response["confidence"],
            "summary": response["summary"],
            "student_meta": student_meta,
        })
        return jsonify(response)
    except Exception as exc:
        log_request({
            "question": question,
            "error": str(exc),
            "student_meta": student_meta,
        })
        return jsonify({
            "status": "error",
            "message": "حدث خطأ أثناء معالجة الطلب.",
            "details": str(exc),
        })


@app.get("/api/kpis")
def api_kpis():
    try:
        report = build_kpi_report()
        return jsonify({
            "status": "ok",
            "kpis": report,
        })
    except Exception as exc:
        return jsonify({
            "status": "error",
            "message": "تعذر توليد مؤشرات الأداء.",
            "details": str(exc),
        })


# ==========================================================
# 🔹 Conversation System
# ==========================================================
@app.post("/api/chat/new")
def api_chat_new():
    user_id = _get_user_id()
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    chat_id = str(uuid.uuid4())
    timestamp = now_iso()
    student_meta = normalize_student_meta(data.get("student_meta"))

    chat = {
        "chat_id": chat_id,
        "user_id": user_id,
        "title": title or "New Chat",
        "created_at": timestamp,
        "updated_at": timestamp,
        "summary": "",
        "messages": [],
        "meta": {"student": student_meta},
    }
    save_chat_atomic(user_id, chat)
    return jsonify({"status": "ok", "chat_id": chat_id, "title": chat["title"], "student_meta": student_meta})


@app.get("/api/chats")
def api_chats_list():
    user_id = _get_user_id()
    chats: List[Dict[str, str]] = []
    user_dir = _user_dir(user_id)
    for path in sorted(user_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            chat = json.loads(path.read_text(encoding="utf-8"))
            chats.append({
                "chat_id": chat.get("chat_id"),
                "title": chat.get("title"),
                "created_at": chat.get("created_at"),
                "updated_at": chat.get("updated_at"),
            })
        except Exception:
            continue
    return jsonify({"status": "ok", "chats": chats})


@app.get("/api/chat/<chat_id>")
def api_chat_get(chat_id: str):
    user_id = _get_user_id()
    try:
        chat = _require_chat(user_id, chat_id)
        return jsonify({"status": "ok", "chat": chat})
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "المحادثة غير موجودة."})


@app.patch("/api/chat/<chat_id>/title")
def api_chat_rename(chat_id: str):
    user_id = _get_user_id()
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"status": "error", "message": "العنوان مطلوب."})
    try:
        chat = _require_chat(user_id, chat_id)
        chat["title"] = title
        chat["updated_at"] = now_iso()
        save_chat_atomic(user_id, chat)
        return jsonify({"status": "ok", "chat_id": chat_id, "title": title})
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "المحادثة غير موجودة."})


@app.delete("/api/chat/<chat_id>")
def api_chat_delete(chat_id: str):
    user_id = _get_user_id()
    path = _chat_path(user_id, chat_id)
    if not path.exists():
        return jsonify({"status": "error", "message": "المحادثة غير موجودة."})
    path.unlink(missing_ok=True)
    return jsonify({"status": "ok", "chat_id": chat_id})


@app.post("/api/chat/<chat_id>/ask")
def api_chat_ask(chat_id: str):
    user_id = _get_user_id()
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"status": "error", "message": "يرجى إدخال السؤال."})

    try:
        chat = _require_chat(user_id, chat_id)
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "المحادثة غير موجودة."})

    student_meta = normalize_student_meta(data.get("student_meta") or chat.get("meta", {}).get("student"))
    chat.setdefault("meta", {})["student"] = student_meta

    timestamp = now_iso()
    chat.setdefault("messages", []).append({
        "role": "user",
        "content": question,
        "ts": timestamp,
    })

    try:
        prompt_for_agent = build_context(chat, question)
        result = run_rag(question, student_meta, prompt_for_agent)
    except Exception as exc:
        log_request({
            "user_id": user_id,
            "chat_id": chat_id,
            "question": question,
            "error": str(exc),
            "student_meta": student_meta,
        })
        return jsonify({
            "status": "error",
            "message": "تعذر معالجة السؤال داخل المحادثة.",
            "details": str(exc),
        })

    assistant_message = result.get("answer", "")
    chat["messages"].append({
        "role": "assistant",
        "content": assistant_message,
        "ts": now_iso(),
    })

    chat_summary = update_summary(chat.get("summary", ""), question, assistant_message)
    chat["summary"] = chat_summary

    if chat.get("title") in ("", "New Chat") and question:
        chat["title"] = make_title_from_first_utterance(question)

    chat["updated_at"] = now_iso()
    save_chat_atomic(user_id, chat)

    log_request({
        "user_id": user_id,
        "chat_id": chat_id,
        "question": question,
        "confidence": result.get("confidence", 0.0),
        "summary": result.get("summary", ""),
        "student_meta": student_meta,
    })

    return jsonify({
        "status": "ok",
        "answer": assistant_message,
        "confidence": result.get("confidence", 0.0),
        "reasoning": result.get("reasoning", ""),
        "summary": result.get("summary", ""),
        "chat_id": chat_id,
        "student_meta": student_meta,
    })
    
# ==========================================================
# 🔹 Deploy
# ==========================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 EduBot API running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
