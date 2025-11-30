import base64
import os
import json
import re
from pathlib import Path
from typing import TypedDict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI

# --- LangChain Imports ---
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEndpointEmbeddings

# --- Qdrant Import ---
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

# --- LangGraph Imports ---
from langgraph.graph import StateGraph, END
from image_cashe import get_cached_description, cache_description

# ==========================================================
# 🔹 .ENV Configuration
# ==========================================================
# (نفترض أن هذا الملف موجود في مجلد src، والـ .env في المجلد الأب)
ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
if not ENV_PATH.exists():
    # (fallback إذا كان الـ .env بجوار الملف)
    ROOT = Path(__file__).resolve().parent
    ENV_PATH = ROOT / ".env"
load_dotenv(ENV_PATH)

# ==========================================================
# 🔹 .Env Keys (نفس المفاتيح)
# ==========================================================
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_CHAT_MODEL = os.getenv("DEEPSEEK_CHAT_MODEL", "deepseek-chat")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

QDRANT_URL = os.getenv("URL_QDRANT")
QDRANT_API_KEY = os.getenv("API_KEY_QDRANT")
HF_API_KEY = os.getenv("HUGGINGFACEHUB_API_TOKEN")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_KEY_2 = os.getenv("OPENROUTER_API_KEY_2")
OPENROUTER_BASE = os.getenv("OPENROUTER_BASE", "https://openrouter.ai/api/v1")
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "meta-llama/llama-3.2-90b-vision-instruct")
OPENROUTER_BACKUP_VISION_MODEL = os.getenv("OPENROUTER_BACKUP_VISION_MODEL", "qwen/qwen-vl-plus")
OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER", "")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE", "")

# ==========================================================
# 🔹 Clients and Embeddings (كما هي)
# ==========================================================
try:
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    print("✅ Qdrant Client: متصل بنجاح.")
except Exception as e:
    print(f"⚠️ Qdrant Client: فشل الاتصال. خطأ: {e}")
    qdrant_client = None

try:
    embeddings = HuggingFaceEndpointEmbeddings(
        model="intfloat/multilingual-e5-large",
        huggingfacehub_api_token=HF_API_KEY
    )
    embeddings.embed_query("test")
    print("✅ HuggingFace Embeddings: جاهز.")
except Exception as e:
    print(f"⚠️ HuggingFace Embeddings: فشل. تأكد من HF_API_KEY. خطأ: {e}")
    embeddings = None

llm = None

try:
    if DEEPSEEK_API_KEY:
        llm = ChatOpenAI(
            openai_api_key=DEEPSEEK_API_KEY,
            openai_api_base=DEEPSEEK_BASE_URL,
            model=DEEPSEEK_CHAT_MODEL,
            temperature=0.1,
        )
        print(f"✅ Agent LLM (DeepSeek): جاهز (موديل: {DEEPSEEK_CHAT_MODEL}).")
    else:
        print("ℹ️ لا يوجد DEEPSEEK_API_KEY في الـ .env، سيتم تجربة Groq.")
except Exception as e:
    print(f"⚠️ فشل تهيئة DeepSeek: {e}")
    llm = None

if llm is None:
    try:
        if GROQ_API_KEY:
            llm = ChatGroq(
                groq_api_key=GROQ_API_KEY,
                model_name=GROQ_MODEL,
                temperature=0.1,
            )
            print(f"✅ Agent LLM (Groq): جاهز (موديل: {GROQ_MODEL}).")
        else:
            print("ℹ️ لا يوجد GROQ_API_KEY في الـ .env.")
    except Exception as e:
        print(f"⚠️ فشل تهيئة Groq: {e}")
        llm = None

# 🔹 تأكيد أخير
if llm is None:
    raise RuntimeError("❌ لا يوجد أي LLM متاح (لا DeepSeek ولا Groq).")


# --- Vision Client (OpenRouter) 
openrouter_client: Optional[OpenAI] = None
openrouter_headers: dict[str, str] = {}
if OPENROUTER_API_KEY:
    try:
        openrouter_client = OpenAI(base_url=OPENROUTER_BASE, api_key=OPENROUTER_API_KEY)
        if OPENROUTER_REFERER:
            openrouter_headers["HTTP-Referer"] = OPENROUTER_REFERER
        if OPENROUTER_TITLE:
            openrouter_headers["X-Title"] = OPENROUTER_TITLE
        print("✅ Vision Client (OpenRouter): جاهز.")
    except Exception as exc:
        print(f"⚠️ Vision Client (OpenRouter): تعذر التهيئة: {exc}")
else:
    print("ℹ️ Vision Client (OpenRouter): لم يتم العثور على API Key، أداة الصور معطلة.")

# ==========================================================
# 🔹 Student Memory (عادت الذاكرة)
# ==========================================================
MEMORY_DIR = ROOT / "memory_store"
MEMORY_DIR.mkdir(exist_ok=True)

def load_student_memory(name: str) -> str:
    path = MEMORY_DIR / f"{name}.json"
    if not path.exists(): return ""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("summary", "")
    except Exception: return ""

def save_student_memory(name: str, summary: str):
    path = MEMORY_DIR / f"{name}.json"
    path.write_text(json.dumps({"summary": summary}, ensure_ascii=False, indent=2), encoding="utf-8")

def update_memory(old: str, question: str, answer: str, image_desc: str = "") -> str:
    # (نستخدم الملخص لتحديث الذاكرة)
    text = f"سأل الطالب: {question[:200]}"
    if image_desc:
        text += f"\n[وصف الصورة المرفقة: {image_desc[:200]}...]"
    
    text += f"\nتم تلخيص الإجابة: {answer[:1000]}"
    merged = (old.strip() + "\n" + text).strip()
    return merged[-5000:] # الاحتفاظ بآخر 5000 حرف


def get_current_term() -> str:
    """
    تحديد الترم الحالي بناءً على التاريخ:
    - الترم الأول: من 15 يوليو إلى 31 يناير
    - الترم الثاني: من 1 فبراير إلى 14 يوليو
    """
    from datetime import datetime
    
    now = datetime.now()
    month = now.month
    day = now.day
    
    # Term 1: July 15 - January 31
    # Term 2: February 1 - July 14
    
    if month >= 7:  # July onwards
        if month == 7 and day < 15:
            return "2"  # Still in term 2
        else:
            return "1"  # Term 1 starts July 15
    elif month <= 1:  # January
        return "1"  # Still in term 1
    else:  # February to early July
        return "2"  # Term 2


# ==========================================================
# 🔹 Helper Functions (Vision) (كما هي)
# ==========================================================
def _format_image_data(image_base64: Optional[str]) -> Optional[str]:
    if not image_base64: return None
    image_base64 = image_base64.strip()
    if not image_base64: return None
    if image_base64.startswith("data:image"): return image_base64
    return f"data:image/png;base64,{image_base64}"

def _invoke_vision_model(prompt: str, image_data_url: str, max_tokens: int = 200) -> Optional[str]:
    """Try primary API key first, then backup API key if primary fails."""
    if not openrouter_client:
        return None
    
    # Try with primary API key
    result = _try_vision_with_api(openrouter_client, "الأساسي", prompt, image_data_url, max_tokens)
    if result:
        return result
    
    # If primary failed and backup API key exists, try backup
    if OPENROUTER_API_KEY_2:
        print(f"🔄 محاولة استخدام API الاحتياطي (OPENROUTER_API_KEY_2)...")
        try:
            backup_client = OpenAI(base_url=OPENROUTER_BASE, api_key=OPENROUTER_API_KEY_2)
            result = _try_vision_with_api(backup_client, "الاحتياطي", prompt, image_data_url, max_tokens)
            if result:
                return result
        except Exception as exc:
            print(f"❌ فشل تهيئة API الاحتياطي: {exc}")
    
    return None


def _try_vision_with_api(client: OpenAI, api_label: str, prompt: str, image_data_url: str, max_tokens: int) -> Optional[str]:
    """Try vision model with a specific API client (tries primary model, then backup model)."""
    # Try primary model first
    try:
        response = client.chat.completions.create(
            model=OPENROUTER_VISION_MODEL,
            messages=[{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": image_data_url}},]}],
            max_tokens=max_tokens, extra_headers=openrouter_headers or None,
        )
        result = response.choices[0].message.content.strip()
        if result:
            print(f"✅ نجح API {api_label} + النموذج الأساسي: {OPENROUTER_VISION_MODEL}")
            return result
    except Exception as exc:
        print(f"⚠️ فشل API {api_label} + النموذج الأساسي ({OPENROUTER_VISION_MODEL}): {exc}")
        print(f"🔄 محاولة النموذج الاحتياطي: {OPENROUTER_BACKUP_VISION_MODEL}")
        
        # Try backup model
        try:
            response = client.chat.completions.create(
                model=OPENROUTER_BACKUP_VISION_MODEL,
                messages=[{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": image_data_url}},]}],
                max_tokens=max_tokens, extra_headers=openrouter_headers or None,
            )
            result = response.choices[0].message.content.strip()
            if result:
                print(f"✅ نجح API {api_label} + النموذج الاحتياطي: {OPENROUTER_BACKUP_VISION_MODEL}")
                return result
        except Exception as backup_exc:
            print(f"❌ فشل API {api_label} + النموذج الاحتياطي: {backup_exc}")
    
    return None

# ==========================================================
# 🔹 📈 State Definition (عادت الذاكرة)
# ==========================================================
class PipelineState(TypedDict):
    question: str
    student_meta: dict
    image_base64: Optional[str]
    
    # (الحقول التي يتم ملؤها)
    memory: str  # (عادت الذاكرة)
    image_description: str
    collection_name: str
    search_query: str
    subject_filter: str  # NEW: Subject for filtering
    retrieved_docs: List[Document]
    answer: str
    summary: str # (عاد الملخص للذاكرة)

# ==========================================================
# 🔹 🔄 Graph Nodes (خط مستقيم + ذاكرة)
# ==========================================================

def load_memory_node(state: PipelineState) -> dict:
    """1. تحميل الذاكرة"""
    name = state["student_meta"].get("name", "local")
    memory_text = load_student_memory(name)
    print(f"1. 🧠 تحميل الذاكرة السابقة للطالب {name}: {len(memory_text)} حرف")
    return {"memory": memory_text}

# ----------------------------------------------------------

def vision_describe_node(state: PipelineState) -> dict:
    """2. وصف الصورة (إن وجدت)"""
    image_data_url = _format_image_data(state.get("image_base64"))
    if not image_data_url or not openrouter_client:
        print("2. 🖼️ لا توجد صورة مرفقة.")
        return {"image_description": ""}

    print("2. 🖼️ استخراج وصف من الصورة المرفقة...")
    
    # Check Cache First
    cached_desc = get_cached_description(state.get("image_base64"))
    if cached_desc:
        print(f"   -> ✅ تم العثور على وصف الصورة في الكاش: {cached_desc[:50]}...")
        return {"image_description": cached_desc}

    instructions = (
        "أعطني وصفًا موجزًا باللغة العربية لما يظهر في الصورة، ركز على الكلمات المفتاحية.\n"
        "حدد المادة الدراسية المحتملة (مثال: رياضيات، علوم، ...). سطرين كحد أقصى."
    )
    response = _invoke_vision_model(instructions, image_data_url, max_tokens=200)
    if not response:
        print("   -> ⚠️ لم يتم الحصول على وصف للصورة.")
        return {"image_description": ""}

    print(f"   -> وصف مختصر للصورة: {response[:50]}...")
    # Save to Cache
    cache_description(state.get("image_base64"), response)
    return {"image_description": response}

# ----------------------------------------------------------

def analyze_node(state: PipelineState) -> dict:
    """3. تحليل السؤال وتحديد المادة (يعرف اسم المادة)"""
    print("3. 🧠 تحليل السؤال وتحديد المادة...")
    image_hint = (state.get("image_description") or "").strip()
    
    # برومبت التحليل (مهم جداً)
    prompt_template = f"""
    مهمتك هي تحليل سؤال طالب وتحديد المادة الدراسية (Collection) المناسبة للبحث فيها.

    السؤال: {state['question']}
    بيانات الطالب: {state['student_meta']}
    { 'وصف الصورة المرفقة: ' + image_hint if image_hint else ''}

    المطلوب منك:
    1.  **استنتاج المادة (subject_en):** من السؤال ووصف الصورة، حدد المادة.
        -   القيم المسموحة فقط: ['arabic', 'maths', 'english', 'science', 'social_studies', 'general']
    2.  **تكوين سؤال البحث (search_query):** أعد صياغة السؤال (مع دمج وصف الصورة) ليكون أفضل للبحث.

    أعد الناتج بصيغة JSON فقط، بدون أي نص قبله أو بعده.

    مثال على المخرجات الصحيحة:
    {{
    "subject_en": "maths",
    "search_query": "شرح المضاعف المشترك الأصغر للعددين 6 و 8"
    }}
    """
    try:
        res = llm.invoke(prompt_template).content
        json_match = re.search(r"\{.*\}", res, re.DOTALL)
        data = json.loads(json_match.group(0)) if json_match else {}
    except Exception as e:
        print(f"   -> ⚠️ فشل تحليل المادة: {e}")
        data = {}

    # (تجهيز المخرجات)
    allowed_subjects = {"arabic", "maths", "english", "science", "social_studies"}
    subject_en = data.get("subject_en", "general").lower().strip()
    
    if subject_en not in allowed_subjects:
        print(f"   -> موضوع غير معروف '{subject_en}'، سيتم استخدام 'maths' افتراضياً.")
        subject_en = "maths" # (الافتراضي)

    grade = state["student_meta"].get("grade", "1")
    term = state["student_meta"].get("term", "1")
    
    # NEW: Collection structure is now grade_term, subject used for filtering
    collection_name = f"g{grade}_t{term}"
    search_query = data.get("search_query", state["question"])

    print(f"   -> المادة: {subject_en} | الكوليكشن: {collection_name}")
    print(f"   -> سؤال البحث: {search_query[:50]}...")
    
    return {
        "collection_name": collection_name,
        "search_query": search_query,
        "subject_filter": subject_en,  # NEW: Pass subject for filtering
    }

# ----------------------------------------------------------

def retrieve_node(state: PipelineState) -> dict:
    """4. استرجاع المستندات (يجيب الحاجة)"""
    print("4. 🔍 استرجاع البيانات...")
    
    collection_name = state["collection_name"]
    search_query = state["search_query"]
    subject_filter = state.get("subject_filter", "")  # NEW: Get subject for filtering
    image_hint = state.get("image_description", "")
    
    # (دمج وصف الصورة مع سؤال البحث)
    final_query = (search_query + " " + image_hint).strip()
    
    if not qdrant_client or not embeddings:
        print("   -> ⚠️ خدمات البحث غير جاهزة.")
        return {"retrieved_docs": []}

    valid_docs = []
    try:
        query_vector = embeddings.embed_query(final_query)
        
        # NEW: Create filter for subject if provided
        query_filter = None
        if subject_filter:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="subject",
                        match=MatchValue(value=subject_filter)
                    )
                ]
            )
            print(f"   -> 🎯 فلترة حسب المادة: {subject_filter}")
        
        results = qdrant_client.query_points(
            collection_name=collection_name,
            query=query_vector,
            query_filter=query_filter,  # NEW: Apply subject filter
            limit=10, # (حد أقصى ثابت)
            with_payload=True,
        ).points
        
        for hit in results:
            content = hit.payload.get("page_content") or hit.payload.get("text")
            if content:
                valid_docs.append(Document(page_content=content, metadata=hit.payload))
        print(f"   -> تم استرجاع {len(valid_docs)} مستند من '{collection_name}'.")
    
    except Exception as e:
        print(f"   -> ⚠️ خطأ في الاسترجاع من '{collection_name}': {e}")

    return {"retrieved_docs": valid_docs}

# ----------------------------------------------------------

def generate_node(state: PipelineState) -> dict:
    """5. توليد الإجابة (يجاوب بس)"""
    print("5. 💬 توليد الإجابة...")
    
    retrieved_context = "\n\n".join([d.page_content for d in state["retrieved_docs"]])
    memory = (state.get("memory") or "").strip()
    
    if not retrieved_context:
        retrieved_context = "لا توجد بيانات مسترجعة من المنهج."
        print("   -> ⚠️ لا يوجد سياق من المنهج، سيتم الاعتماد على الذاكرة والمعلومات العامة.")

    context_sections = []
    if memory:
        context_sections.append(f"## ملخص المحادثات السابقة (الذاكرة):\n{memory}") # (الذاكرة هنا)
    context_sections.append(f"## نصوص من المنهج (السياق):\n{retrieved_context}")
    
    combined_context = "\n\n".join(context_sections)

    # (برومبت التوليد المباشر)
    prompt = f"""
أنت معلم ذكي وصبور تشرح المفاهيم للأطفال.
مهمتك هي الإجابة على سؤال الطالب بناءً على "السياق" (نصوص المنهج) و "الذاكرة" (المحادثات السابقة).

## قواعد الإجابة:
-   اشرح بأسلوب سهل وواضح يناسب عمر الطالب.
-   **اعتمد أولاً على "نصوص من المنهج"**.
-   إذا كان السياق فارغاً، استخدم "الذاكرة" أو معلوماتك العامة (بفضل الـ Temperature)، ولكن اذكر أن المعلومة "قد لا تكون من المنهج".
-   استخدم الأرقام الإنجليزية (0-9) دائماً.
-   استخدم نفس لغة سؤال الطالب (إن كان بالعربية فأجب بالعربية، وإن كان بالإنجليزية فأجب بالإنجليزية).

---
## بيانات الطالب:
{state['student_meta']}

## السياق والذاكرة:
{combined_context}
---

## السؤال:
{state['question']}
{state.get('image_description') or ''}

أجب الآن على السؤال (إجابة مباشرة بدون JSON):
"""
    
    res = None
    image_data_url = _format_image_data(state.get("image_base64"))

    # (استخدام نموذج الرؤية إذا كانت الصورة موجودة)
    if image_data_url and openrouter_client:
        print("   -> 🖼️ محاولة استخدام نموذج الرؤية (للتوليد) بسبب وجود صورة.")
        res = _invoke_vision_model(prompt, image_data_url, max_tokens=700)
        # (الباقي كما هو)
        if res:
            print("   -> ✅ تم توليد الإجابة باستخدام نموذج الرؤية.")
        else:
            print("   -> ⚠️ لم ينجح نموذج الرؤية، سيتم استخدام النموذج النصي.")

    if not res:
        try:
            res = llm.invoke(prompt, max_tokens=700).content
        except Exception as exc:
            print(f"   -> ⚠️ خطأ أثناء التوليد: {exc}")
            res = "عذراً، حدث خطأ أثناء محاولة الإجابة."

    print(f"   -> الإجابة: {res[:60]}...")
    return {"answer": res}

# ----------------------------------------------------------

def summarize_node(state: PipelineState) -> dict:
    """6. تلخيص الإجابة (لتحديث الذاكرة)"""
    print("6. 📝 تلخيص الإجابة للذاكرة...")
    answer_text = (state.get("answer") or "").strip()
    if not answer_text or "حدث خطأ" in answer_text:
        return {"summary": "لم يتم تقديم إجابة."}

    prompt = f"""
لخص الإجابة التالية بشكل شامل لتعمل كـ "ذاكرة" للمحادثة.
الهدف هو الاحتفاظ بالمعلومات الهامة لاستخدامها لاحقاً.

القواعد:
1. احتفظ بالتفاصيل الجوهرية مثل: الأسئلة في الاختبارات، الأرقام، التواريخ، والأسماء.
2. إذا كانت الإجابة تحتوي على قائمة (مثل أسئلة كويز)، لخصها بذكر النقاط الرئيسية أو الأسئلة نفسها باختصار، ولا تكتفِ بالقول "تم عمل كويز".
3. اجعل الملخص مركزاً ومفيداً لاسترجاع السياق لاحقاً.

الإجابة الأصلية:
{answer_text}

الملخص الشامل:
"""
    try:
        summary_text = llm.invoke(prompt, max_tokens=500).content.strip()
    except Exception:
        summary_text = answer_text[:100] # (Fallback)

    print(f"   -> الملخص: {summary_text[:60]}...")
    return {"summary": summary_text}

# ----------------------------------------------------------

def save_memory_node(state: PipelineState) -> dict:
    """7. حفظ الذاكرة المحدثة"""
    print("7. 💾 تحديث ذاكرة الطالب...")
    name = state["student_meta"].get("name", "local")
    new_summary = update_memory(
        state.get("memory", ""),
        state["question"],
        state.get("summary", ""), # (نحفظ الملخص)
        state.get("image_description", "") # (نحفظ وصف الصورة)
    )
    save_student_memory(name, new_summary)
    print(f"   -> تم حفظ الذاكرة ({len(new_summary)} حرف).")
    return {} # (لا نحتاج لإرجاع شيء للحالة)

# ==========================================================
# 🔹 🔗 Graph Building (خط أنابيب ثابت بالذاكرة)
# ==========================================================
def build_standard_rag_graph():
    g = StateGraph(PipelineState)
    
    # 1. إضافة العقد بالترتيب
    g.add_node("load_memory", load_memory_node) # (البداية)
    g.add_node("vision", vision_describe_node)
    g.add_node("analyze", analyze_node)
    g.add_node("retrieve", retrieve_node)
    g.add_node("generate", generate_node)
    g.add_node("summarize", summarize_node)
    g.add_node("save_memory", save_memory_node) # (النهاية)
    
    # 2. ربط المسار (خط مستقيم)
    g.set_entry_point("load_memory")
    g.add_edge("load_memory", "vision")
    g.add_edge("vision", "analyze")
    g.add_edge("analyze", "retrieve")
    g.add_edge("retrieve", "generate")
    g.add_edge("generate", "summarize")
    g.add_edge("summarize", "save_memory")
    g.add_edge("save_memory", END)

    print("\n🚀 تم بناء Standard RAG Pipeline (with Memory) بنجاح.")
    return g.compile()

# ==========================================================
# 🔹 Deployment Function (المنفذ)
# ==========================================================
def run_standard_rag(
    question: str,
    student_meta: dict,
    image_base64: str | None = None,
):
    if not all([qdrant_client, embeddings, llm]):
        print("❌ لا يمكن التشغيل. الخدمات الأساسية غير جاهزة.")
        return {"error": "الخدمات الأساسية غير جاهزة."}

    # Auto-detect term if not provided
    if "term" not in student_meta or not student_meta["term"]:
        student_meta["term"] = get_current_term()
        print(f"🗓️ تم تحديد الترم تلقائياً: الترم {student_meta['term']}")

    app = build_standard_rag_graph()
    
    # (تجهيز الحالة الأولية)
    init_state: PipelineState = {
        "question": question,
        "student_meta": student_meta,
        "image_base64": image_base64,
        # (الباقي سيتم ملؤه بواسطة الـ Graph)
        "memory": "",
        "image_description": "",
        "collection_name": "",
        "search_query": "",
        "subject_filter": "",  # NEW: Subject for filtering
        "retrieved_docs": [],
        "answer": "",
        "summary": "",
    }
    
    print(f"\n--- 🚀 بدء تشغيل الـ Pipeline للسؤال: '{question[:40]}...' ---")
    final_state = app.invoke(init_state)
    
    print("\n" + "=" * 50)
    print("🎉 النتيجة النهائية (Standard RAG):")
    print(f"الإجابة:\n{final_state.get('answer', 'لا توجد إجابة.')}")
    print("=" * 50)
    
    return final_state

# ==========================================================
# 🔹 Local Deploy (للتجربة)
# ==========================================================
if __name__ == "__main__":
    student_meta = {"grade": "5", "term": "1", "name": "Omar", "age": "11"}

    # --- تجربة 1: سؤال إنجليزي (سيتم حفظه في الذاكرة) ---
    # print("\n" + "#" * 50)
    # print("### تجربة 1: سؤال إنجليزي (English)")
    # print("#" * 50)
    # question_en = "../Screenshot from 2025-10-15 22-44-35.png"
    # run_standard_rag(question_en, student_meta)

    # --- تجربة 2: سؤال رياضيات (سيقرأ ذاكرة السؤال الأول) ---
    print("\n" + "#" * 50)
    print("### تجربة 2: سؤال رياضيات (Maths)")
    print("#" * 50)
    question_math = "ما هو المضاعف المشترك الأصغر للعددين 6 و 8؟"
    run_standard_rag(question_math, student_meta)

    # # --- تجربة 3: سؤال عام (سيقرأ الذاكرة ويجيب بمعلوماته) ---
    # print("\n" + "#" * 50)
    # print("### تجربة 3: سؤال عام (General)")
    # print("#" * 50)
    # question_general = "ما هي عاصمة البرازيل؟"
    # run_standard_rag(question_general, student_meta)