# app/ask.py
import os

os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=ROOT / ".env")

from llama_index.core import Settings, StorageContext, load_index_from_storage
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.faiss import FaissVectorStore

HAS_RERANK = False
SentenceTransformerRerank = None
try:
    from llama_index.core.postprocessor import SentenceTransformerRerank as _R  # أحدث
    SentenceTransformerRerank = _R
    HAS_RERANK = True
except Exception:
    try:
        from llama_index.core.postprocessor import SentenceTransformerRerank as _R      # أقدم
        SentenceTransformerRerank = _R
        HAS_RERANK = True
    except Exception:
        print("⚠️ SentenceTransformerRerank غير متاح: هيشتغل بدون rerank. "
            "ثبّت: pip install -U sentence-transformers")

AR2EN = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

DEFAULT_INDEX_DIR = "/home/mohamed/DEPI_Project/Indexes/maths/g5/t1/index_math_g5_t1"
INDEX_DIR = Path(os.getenv("INDEX_DIR", str(DEFAULT_INDEX_DIR))).expanduser()

SYSTEM_PROMPT = (
    "وضع Ali5: اشرح كأنك تتكلم مع طفل عمره 5 سنين.\n"
    "اكتب بالعربية الفصحى فقط، ولا تستخدم أي كلمات من لغات أخرى.\n"
    "الأسلوب:\n"
    "- جُمَل قصيرة جدًا وكلمات سهلة.\n"
    "- عرِّف أي كلمة جديدة بكلمتين بسيطتين + مثال صغير.\n"
    "- استخدم ترقيم واضح (1، 2، 3) للخطوات.\n"
    "- لو احتجت مثالًا، قدِّم مثالًا بسيطًا. إن لم يوجد في المقاطع، قل: (مثال للتوضيح فقط).\n"
    "\n"
    "الالتزام بالمصادر:\n"
    "- اعتمد على المقاطع المسترجعة. إن لم تكفِ، قل: (المعلومات غير كافية من الكتاب).\n"
    "\n"
    "لو السؤال رياضيات أو فيه معادلة:\n"
    "- اعرض خطوات الحل هكذا:\n"
    "  1) نفهم المطلوب والمعطيات.\n"
    "  2) نختار القاعدة/الفكرة.\n"
    "  3) ننفّذ الحساب خطوة خطوة، سطر بسطر.\n"
    "  4) نتحقّق من النتيجة.\n"
    "\n"
    "صيغة الإجابة دائمًا:\n"
    "- الفكرة ببساطة: ...\n"
    "- (لو رياضيات) خطوات الحل: 1→2→3→4.\n"
    "- مثال توضيحي: ... (قصير).\n"
)


def _normalize_base(url: str) -> str:
    if not url:
        return url
    url = url.rstrip("/")
    if url.endswith("/chat/completions"):
        url = url[: -len("/chat/completions")]
    return url

def _attach_llm():
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        Settings.llm = None
        return
    try:
        from llama_index.llms.groq import Groq
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        Settings.llm = Groq(model=model, api_key=groq_key, temperature=0.2)
        return
    except Exception:
        pass
    try:
        from llama_index.llms.openai_like import OpenAILike
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        api_base = _normalize_base(os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1"))
        Settings.llm = OpenAILike(model=model, api_base=api_base, api_key=groq_key)
        return
    except Exception:
        Settings.llm = None

def build_query_engine(index_dir: Path, top_k: int = 4, use_rerank: bool = True):
    Settings.embed_model = HuggingFaceEmbedding(
        model_name="intfloat/multilingual-e5-small", normalize=True
    )
    _attach_llm()

    index_dir = Path(index_dir)
    vector_store = FaissVectorStore.from_persist_dir(persist_dir=str(index_dir))
    storage_ctx = StorageContext.from_defaults(persist_dir=str(index_dir),
                                                vector_store=vector_store)
    index = load_index_from_storage(storage_ctx)


    # BAAI/bge-reranker-v2-m3 (another reranker: cross-encoder/ms-marco-MiniLM-L-6-v2)
    postprocs = []
    if use_rerank and HAS_RERANK:
        postprocs.append(
            SentenceTransformerRerank(
                model="cross-encoder/ms-marco-MiniLM-L-6-v2",
                top_n=top_k,
            )
        )

    kwargs = {
        "similarity_top_k": top_k,
        "response_mode": "compact",
        "node_postprocessors": postprocs or None,
    }

    if Settings.llm is not None:
        try:
            from llama_index.core.prompts import PromptTemplate
            kwargs["text_qa_template"] = PromptTemplate(SYSTEM_PROMPT)
        except Exception:
            pass

    return index.as_query_engine(**kwargs)

def main():
    final_index = INDEX_DIR if INDEX_DIR.is_absolute() else (ROOT / INDEX_DIR)
    print(f"Using index dir: {final_index}")
    if not final_index.exists():
        print("❌ Index dir not found. تأكد وجود default__vector_store.json داخل المجلد.")
        return

    top_k = int(os.getenv("TOP_K", "8"))
    use_rerank = os.getenv("USE_RERANK", "1") != "0"

    print("Loading index and building query engine...")
    engine = build_query_engine(final_index, top_k=top_k, use_rerank=use_rerank)

    print("🤖 اكتب سؤالك بالعربي (اكتب q للخروج):")
    while True:
        q = input("\nسؤالك: ").strip()
        if not q or q.lower() == "q":
            break
        q_norm = q.translate(AR2EN)
        resp = engine.query(q_norm)

        print("\n=== الإجابة ===")
        print(str(resp).strip())

        # مصادر
        if getattr(resp, "source_nodes", None):
            print("\n--- مصادر من الكتاب ---")
            for i, n in enumerate(resp.source_nodes, 1):
                md = n.node.metadata or {}
                page = md.get("page")
                subj = md.get("subject")
                grade = md.get("grade")
                score = getattr(n, "score", None)
                score_txt = f" | score={score:.3f}" if isinstance(score, (float, int)) else ""
                print(f"[{i}] صفحة: {page} | مادة: {subj} | صف: {grade}{score_txt}")
                snippet = (n.node.get_content() or "").strip().replace("\n", " ")
                if len(snippet) > 200:
                    snippet = snippet[:200] + "..."
                print(f"    {snippet}")

if __name__ == "__main__":
    main()
