#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

from pathlib import Path
from dotenv import load_dotenv
import re

from qdrant_client import QdrantClient
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# ============== CONFIG ==============
ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"

TOP_K_OVERALL = 10        # Total snippets sent to LLM
TOP_K_PER_COLLECTION = 8  # Max snippets collected from each collection before merging
EMBED_MODEL_NAME = "intfloat/multilingual-e5-small"
# ====================================


# -------------------------------
# (0) Checks and cleaning rules
# -------------------------------

# is the question really a "calculation problem"?
_CALC_PAT = re.compile(r"[+\-*/×÷%]|(?:ناتج|احسب|يساوي|كم\s+يساوي|قيمة|حل)", re.I)
def is_calc_question(q: str) -> bool:
    trans = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
    qn = (q or "").translate(trans)
    return bool(_CALC_PAT.search(qn)) and any(ch.isdigit() for ch in qn)

# Question language detection
def detect_reply_lang(s: str) -> str:
    ar = len(re.findall(r"[\u0600-\u06FF]", s or ""))
    en = len(re.findall(r"[A-Za-z]", s or ""))
    if en > ar: return "en"
    return "ar"

# Model Response Language Instruction
def lang_instruction(lang: str) -> str:
    return "أجب بالعربية الفصحى فقط." if lang == "ar" else "Answer in simple English only."

# Additional cleaning: remove any numbered lists if the question is not math-related
def strip_numbering_if_not_math(answer: str, is_math: bool) -> str:
    if is_math:
        return answer
    return re.sub(r"(?m)^\s*\d+\s*[)\.\-–]\s*", "", answer).strip()

# TOP-K filtering by subject 
def subject_of_top_hit(hits):
    for h in sorted(hits, key=lambda x: x["score"], reverse=True):
        subj = (h.get("subject") or "").strip().lower()
        if subj:
            return subj
    return None

def filter_hits_to_subject_topk(hits, subject: str, k: int):
    if subject:
        hits = [h for h in hits if (h.get("subject") or "").strip().lower() == subject]
    return sorted(hits, key=lambda x: x["score"], reverse=True)[:k]


# -------------------------------
# (1) Prepare the LLM (Groq if available)
# -------------------------------
def load_llm():
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        return None
    try:
        from llama_index.llms.groq import Groq
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        llm = Groq(model=model, api_key=groq_key, temperature=0.2)
        Settings.llm = llm
        return llm
    except Exception:
        try:
            from llama_index.llms.openai_like import OpenAILike
            model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            api_base = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1").rstrip("/")
            llm = OpenAILike(model=model, api_base=api_base, api_key=groq_key)
            Settings.llm = llm
            return llm
        except Exception:
            return None


# -------------------------------
# (2) Qdrant helpers
# -------------------------------
def get_matching_collections(client: QdrantClient, grade: int, term: int):
    """ Returen Collections That ends with *_g{grade}_t{term} """
    suffix = f"_g{grade}_t{term}"   
    cols = client.get_collections().collections
    return [c.name for c in cols if c.name.endswith(suffix)]

def search_all(client: QdrantClient, embed, collections, query: str,
               top_k_per_collection: int = TOP_K_PER_COLLECTION):
    """Pull top results from each collection, then merge and sort by score descending."""
    qvec = embed.get_query_embedding(query)
    hits = []
    for col in collections:
        try:
            res = client.query_points(
                collection_name=col,
                query=qvec,
                with_payload=True,
                limit=top_k_per_collection,
            )
            for p in res.points:
                payload = p.payload or {}
                hits.append({
                    "collection": col,
                    "score": float(p.score),
                    "text": (payload.get("text") or "").strip(),
                    "source": payload.get("source", ""),
                    "page": payload.get("page", ""),
                    "subject": payload.get("subject", ""),
                    "grade": payload.get("grade", ""),
                    "term": payload.get("term", ""),
                })
        except Exception as e:
            print(f"⚠️ query error in {col}: {e}")
            continue
    hits.sort(key=lambda x: x["score"], reverse=True)
    return hits


# -------------------------------
# (3) Build context and prompt
# -------------------------------
def build_context(hits, top_k_overall: int = TOP_K_OVERALL):
    chosen = hits[:top_k_overall]
    ctx_lines = []
    sources = []
    for i, h in enumerate(chosen, 1):
        snippet = (h["text"] or "").strip()
        meta = f"[{i}] src={h['source']} page={h['page']} col={h['collection']}"
        ctx_lines.append(f"{meta}\n{snippet}")
        sources.append((i, h))
    context = "\n\n".join(ctx_lines)
    return context, sources

def build_prompt(user_question: str, context: str):
    lang = detect_reply_lang(user_question)
    lang_line = lang_instruction(lang)

    SYSTEM_PROMPT = (
        "وضع Ali5: اشرح كأنك تتكلم مع طفل عمره 5 سنين.\n"
        "أجب بلغة السؤال كما هي. If the question is in English, answer in simple English.\n"
        f"{lang_line}\n"
        "الأسلوب:\n"
        "- جُمَل متوسطة الطول وكلمات سهلة.\n"
        "- عرِّف أي كلمة جديدة بكلمتين بسيطتين + مثال صغير (إن لزم). إن لم يوجد مثال من المقاطع، اكتب: (مثال للتوضيح فقط).\n"
        "- لا تستخدم تعدادًا بالأرقام (1، 2، 3) إلا إذا كان السؤال مسألة حسابية فيها عمليات (+ − × ÷ %).\n"
        "\n"
        "الالتزام بالمصادر:\n"
        "- اعتمد فقط على المقاطع المرفقة. إن لم تكفِ، اكتب: (المعلومات غير كافية من الكتاب).\n"
        "\n"
        "لو السؤال مسألة حسابية:\n"
        "  1) نفهم المطلوب والمعطيات.\n"
        "  2) نختار القاعدة.\n"
        "  3) ننفّذ الحساب خطوة خطوة باختصار.\n"
        "  4) نتحقق من النتيجة.\n"
    )

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"السؤال:\n{user_question}\n\n"
        f"المقاطع المسترجعة:\n{context}\n\n"
        f"أجب بالاعتماد على المقاطع فقط."
    )

def print_sources(sources):
    print("\n--- مصادر من الكتاب ---")
    for i, h in sources:
        score = h["score"]
        src = h["source"]; page = h["page"]; col = h["collection"]
        print(f"[{i}] score={score:.4f} | src={src} | page={page} | col={col}")
        # print("    " + h["text"].replace("\n", " ") + "\n")

# -------------------------------
# (4) Deployment
# -------------------------------
def main():
    # 1) Env & clients
    load_dotenv(ENV_PATH)
    url = os.getenv("URL_QDRANT"); key = os.getenv("API_KEY_QDRANT")
    if not url or not key:
        raise EnvironmentError("❌ ضع URL_QDRANT و API_KEY_QDRANT في .env")

    client = QdrantClient(url=url, api_key=key)
    embed = HuggingFaceEmbedding(model_name=EMBED_MODEL_NAME, normalize=True)
    llm = load_llm()  # ممكن يكون None

    # 2) Enter grade & term
    print("ادخل الصف الدراسي والترم للبحث:")
    while True:
        try:
            grade = int(input("enter grade (1 to 6): ").strip())
            if grade not in (1,2,3,4,5,6): raise ValueError
            break
        except Exception:
            print("⚠️ من 1 لـ 6 فقط.")
    while True:
        try:
            term = int(input("enter term (1 or 2): ").strip())
            if term not in (1,2): raise ValueError
            break
        except Exception:
            print("⚠️ اختَر 1 أو 2.")

    # 3) Get collections for that grade & term
    collections = get_matching_collections(client, grade, term)
    if not collections:
        print(f"❌ No Collections that ends with _g{grade}_t{term}")
        return
    print("Selected Collections:", ", ".join(collections))

    # 4) Ask
    print("\n🤖 اكتب سؤالك (q للخروج):")
    while True:
        q = input("\nسؤالك: ").strip()
        if not q or q.lower() == "q":
            break

        # Initial search From All Collections
        hits = search_all(client, embed, collections, q, TOP_K_PER_COLLECTION)
        if not hits:
            print("⚠️ No Matching Results.")
            continue

        # Get Top-K from Dominant Subject
        dom_subj = subject_of_top_hit(hits)
        hits = filter_hits_to_subject_topk(hits, dom_subj, k=TOP_K_OVERALL)

        # Build context from filtered snippets
        context, sources = build_context(hits, TOP_K_OVERALL)

        # If no LLM → print top snippets only
        if llm is None:
            print("\n=== أفضل النتائج (بدون توليد) ===")
            for i, h in sources:
                txt = h["text"].replace("\n", " ")
                print(f"[{i}] score={h['score']:.4f} | src={h['source']} | page={h['page']} | col={h['collection']}")
                print(f"    {txt[:200]}\n")
            continue

        # With LLM → build prompt & generate answer
        prompt = build_prompt(q, context)
        try:
            answer = llm.complete(prompt).text
            # Delete any numbered lists if the question is not math-related
            answer = strip_numbering_if_not_math(answer, is_calc_question(q))
        except Exception as e:
            print(f"⚠️ LLM error: {e}")
            # fallback : Print top snippets
            print("\n=== Top Snippets ===")
            for i, h in sources:
                txt = h["text"].replace("\n", " ")
                print(f"[{i}] score={h['score']:.4f} | src={h['source']} | page={h['page']} | col={h['collection']}")
                print(f"    {txt[:200]}\n")
            continue

        print("\n=== الإجابة ===")
        print(answer.strip())
        print_sources(sources)


if __name__ == "__main__":
    main()
