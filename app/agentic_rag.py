import base64
import os
import json
import re
from pathlib import Path
from typing import TypedDict, List, Optional, Annotated

from dotenv import load_dotenv
from openai import OpenAI

# --- LangChain Imports ---
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_community.tools.tavily_search import TavilySearchResults

# --- Qdrant Import ---
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

# --- LangGraph Imports ---
from langgraph.graph import StateGraph, END
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
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
# 🔹 .Env Keys
# ==========================================================
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_CHAT_MODEL = os.getenv("DEEPSEEK_CHAT_MODEL", "deepseek-chat")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_BASE = os.getenv("GROQ_API_BASE", "https://api.groq.com/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

QDRANT_URL = os.getenv("URL_QDRANT")
QDRANT_API_KEY = os.getenv("API_KEY_QDRANT")
HF_API_KEY = os.getenv("HUGGINGFACEHUB_API_TOKEN")

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_KEY_2 = os.getenv("OPENROUTER_API_KEY_2")
OPENROUTER_BASE = os.getenv("OPENROUTER_BASE", "https://openrouter.ai/api/v1")
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "meta-llama/llama-3.2-90b-vision-instruct")
OPENROUTER_BACKUP_VISION_MODEL = os.getenv("OPENROUTER_BACKUP_VISION_MODEL", "qwen/qwen-vl-plus")
OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER", "")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE", "")

CURRENT_IMAGE_BASE64: Optional[str] = None

# ==========================================================
# 🔹 Clients and Embeddings
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
    # (اختبار سريع للـ Embeddings)
    embeddings.embed_query("test")
    print("✅ HuggingFace Embeddings: جاهز.")
except Exception as e:
    print(f"⚠️ HuggingFace Embeddings: فشل. تأكد من HF_API_KEY. خطأ: {e}")
    embeddings = None

llm = None

# # 2️⃣ المحاولة الأولي: DeepSeek - deepseek-chat
if llm is None:
    try:
        if DEEPSEEK_API_KEY:
            llm = ChatOpenAI(
                openai_api_key=DEEPSEEK_API_KEY,
                openai_api_base=DEEPSEEK_BASE_URL,
                model=DEEPSEEK_CHAT_MODEL or "deepseek-chat",
                temperature=0.1,
            )
            print(f"✅ Agent LLM (DeepSeek): جاهز (موديل: {DEEPSEEK_CHAT_MODEL or 'deepseek-chat'}).")
        else:
            print("ℹ️ لا يوجد DEEPSEEK_API_KEY في الـ .env، سيتم تجربة OpenRouter + Qwen.")
    except Exception as e:
        print(f"⚠️ فشل تهيئة DeepSeek: {e}")
        llm = None

# 1️⃣ المحاولة الثانية: Groq - gpt-oss-120
if llm is None:
    try:
        if GROQ_API_KEY:
            llm = ChatGroq(
                groq_api_key=GROQ_API_KEY,
                model_name="openai/gpt-oss-120b",
                temperature=0.1,
            )
            print(f"✅ Agent LLM (Groq): جاهز (موديل: openai/gpt-oss-120b).")
        else:
            print("ℹ️ لا يوجد GROQ_API_KEY في الـ .env.")
    except Exception as e:
        print(f"⚠️ فشل تهيئة Groq: {e}")
        llm = None

# 3️⃣ المحاولة الثالثة: OpenRouter - Qwen 2.5 72B Instruct
OPENROUTER_CHAT_MODEL = os.getenv("OPENROUTER_CHAT_MODEL", "qwen/qwen-2.5-72b-instruct")

if llm is None:
    try:
        if OPENROUTER_API_KEY:
            llm = ChatOpenAI(
                openai_api_key=OPENROUTER_API_KEY,
                openai_api_base=OPENROUTER_BASE,
                model=OPENROUTER_CHAT_MODEL,
                temperature=0.1,
            )
            print(f"✅ Agent LLM (OpenRouter/Qwen): جاهز (موديل: {OPENROUTER_CHAT_MODEL}).")
        else:
            print("ℹ️ لا يوجد OPENROUTER_API_KEY في الـ .env.")
    except Exception as e:
        print(f"⚠️ فشل تهيئة OpenRouter/Qwen: {e}")
        llm = None

# 1️⃣ المحاولة الرابعة: Groq - Llama 3.3 70B Versatile
try:
    if GROQ_API_KEY:
        llm = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL or "llama-3.3-70b-versatile",
            temperature=0.1,
        )
        print(f"✅ Agent LLM (Groq): جاهز (موديل: {GROQ_MODEL or 'llama-3.3-70b-versatile'}).")
    else:
        print("ℹ️ لا يوجد GROQ_API_KEY في الـ .env، سيتم تجربة DeepSeek.")
except Exception as e:
    print(f"⚠️ فشل تهيئة Groq: {e}")
    llm = None


# 🔹 تأكيد أخير
if llm is None:
    raise RuntimeError("❌ لا يوجد أي LLM متاح (لا Groq ولا DeepSeek ولا OpenRouter/Qwen).")

# --- Vision Client (OpenRouter) ---
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
# 🔹 Student Memory (As Is)
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
    text = f"سأل الطالب: {question[:200]}"
    if image_desc:
        text += f"\n[وصف الصورة المرفقة: {image_desc[:200]}...]"
    
    text += f"\nأجاب المساعد (ملخص): {answer[:1000]}"
    merged = (old.strip() + "\n" + text).strip()
    return merged[-5000:] # الاحتفاظ بآخر 5000 حرف

def summarize_for_memory(answer_text: str) -> str:
    """تلخيص الإجابة باستخدام LLM لحفظها في الذاكرة (نفس منطق rag.py)"""
    if not answer_text: return ""
    
    prompt = f"""
لخص الإجابة التالية بشكل شامل لتعمل كـ "ذاكرة" للمحادثة.
الهدف هو الاحتفاظ بالمعلومات الهامة لاستخدامها لاحقاً.

القواعد:
1. احتفظ بالتفاصيل الجوهرية مثل: الأسئلة في الاختبارات، الأرقام، التواريخ، والأسماء.
2. إذا كانت الإجابة تحتوي على قائمة (مثل أسئلة كويز)، لخصها بذكر النقاط الرئيسية أو الأسئلة نفسها باختصار.
3. اجعل الملخص مركزاً ومفيداً لاسترجاع السياق لاحقاً.

الإجابة الأصلية:
{answer_text}

الملخص الشامل:
"""
    try:
        # نستخدم llm الموجود في الملف (سواء DeepSeek أو Groq)
        return llm.invoke(prompt, max_tokens=500).content.strip()
    except Exception as e:
        print(f"⚠️ فشل تلخيص الذاكرة: {e}")
        return answer_text[:1000] # Fallback


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
    
    if month >= 7:
        if month == 7 and day < 15:
            return "2"
        else:
            return "1"
    elif month <= 1:
        return "1"
    else: 
        return "2"


# ==========================================================
# 🔹 Helper Functions (Vision)
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
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                }
            ],
            max_tokens=max_tokens,
            extra_headers=openrouter_headers or None,
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
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_data_url}},
                        ],
                    }
                ],
                max_tokens=max_tokens,
                extra_headers=openrouter_headers or None,
            )
            result = response.choices[0].message.content.strip()
            if result:
                print(f"✅ نجح API {api_label} + النموذج الاحتياطي: {OPENROUTER_BACKUP_VISION_MODEL}")
                return result
        except Exception as backup_exc:
            print(f"❌ فشل API {api_label} + النموذج الاحتياطي: {backup_exc}")
    
    return None


def _collect_tool_context(messages: List[BaseMessage]) -> str:
    """نجمع كل المخرجات النصية من أدوات الاسترجاع/البحث لتغذيتها في نموذج الرؤية."""
    contexts: List[str] = []
    for msg in messages:
        if isinstance(msg, ToolMessage):
            content = msg.content
            if isinstance(content, str):
                text = content
            elif isinstance(content, list):
                parts = []
                for part in content:
                    if isinstance(part, dict):
                        parts.append(part.get("text", ""))
                text = "".join(parts)
            else:
                text = str(content)
            text = text.strip()
            if text:
                contexts.append(text)
    return "\n\n".join(contexts)


def _generate_vision_final_answer(
    question: str,
    student_meta: dict,
    memory_text: str,
    retrieved_context: str,
    image_description: str,
    image_base64: Optional[str],
) -> Optional[str]:
    if not image_base64:
        return None
    image_data_url = _format_image_data(image_base64)
    if not image_data_url:
        return None

    prompt = f"""
أنت "مساعد تعليمي ذكي وخبير" تعمل ضمن نظام Agentic RAG.
لقد استخدمت أدوات متعددة (مثل استرجاع مستندات المنهج والبحث في الويب) وجمعت سياقاً وافياً للإجابة.
الآن حان وقت "صياغة الإجابة النهائية" بناءً على كل ما تم جمعه.
## 🎯 مهمتك:
اعتمد على "السياق" و"وصف الصورة" و"ذاكرة الطالب" لتوليد إجابة دقيقة وواضحة تناسب عمر الطالب.
يجب أن تحافظ على نفس أسلوبك كشخصية Agentic:
- تتحدث بلغة بسيطة ومفهومة.
- تشرح بهدوء وبطريقة تعليمية.
- لا تستخدم لغة المعلمين التقليدية الرسمية، بل أسلوب المساعد التفاعلي.
---
## ⚡ قواعد صياغة الإجابة النهائية:
1. لا تعتمد على معلوماتك العامة إطلاقاً بدون سياق.
2. إذا كانت الصورة تحتوي أسئلة واختيارات، حلّها واحداً تلو الآخر وقدّم الإجابة مع تبرير مختصر.
3. إذا كان السياق من المنهج، قل: "حسب المنهج الدراسي...".
   إذا كان من الويب، قل: "بحسب المعلومات العامة...".
4. استخدم الأرقام الإنجليزية (0–9) دائماً.
5. اشرح بأسلوب يناسب المرحلة الدراسية للطالب (انظر بيانات الطالب).
6. استخدم نفس لغة سؤال الطالب (إن كان بالعربية فأجب بالعربية، وإن كان بالإنجليزية فأجب بالإنجليزية).
---
## 🧠 بيانات الطالب:
{json.dumps(student_meta, ensure_ascii=False)}
## 🗂️ ذاكرة الطالب (ملخص المحادثات السابقة):
{memory_text or 'لا توجد محادثات سابقة.'}
## 📚 السياق المستخرج من الأدوات (من retrieve_documents أو web_search):
{retrieved_context if retrieved_context.strip() else 'لم يتم العثور على سياق من الأدوات.'}
## 🖼️ وصف الصورة (الذي سبق تحليله):
{image_description or 'لا يوجد وصف متاح.'}
---
## ❓سؤال الطالب:
{question}
---
✳️ الآن، صِغ إجابة تعليمية كاملة بناءً على ما سبق، واعتبر أنك ترى الصورة فعلاً (تم تمريرها إليك).
لا تذكر تفاصيل تقنية عن الصورة أو عملية التحليل، فقط استخدمها لتقديم إجابة تعليمية وافية وواضحة للطالب.
أجب الآن:
""".strip()

    return _invoke_vision_model(prompt, image_data_url, max_tokens=800)

# ==========================================================
# 🔹 🛠️ Tools Definition (الأدوات)
# ==========================================================

@tool
def describe_image(image_base64: str | None = None) -> str:
    """
    يستخدم لوصف صورة مرفقة من الطالب لفهم محتواها التعليمي.
    لا تستخدم هذه الأداة إلا إذا كانت هناك صورة (image_base64).
    """
    print("... 🖼️ (أداة) جارٍ وصف الصورة ...")
    data = image_base64 or CURRENT_IMAGE_BASE64
    if not data:
        return "لا توجد صورة متاحة للاطلاع عليها."

    image_data_url = _format_image_data(data)
    if not image_data_url:
        return "خطأ: لم يتم تمرير بيانات الصورة بشكل صحيح."

    # Check Cache First
    cached_desc = get_cached_description(data)
    if cached_desc:
        print(f"   -> ✅ (أداة) تم العثور على وصف الصورة في الكاش: {cached_desc[:50]}...")
        return cached_desc

    instructions = (
        "أنت محلل يساعد في فهم الصور التعليمية.\n"
        "أعطني وصفًا موجزًا باللغة العربية لما يظهر في الصورة، مع التركيز على الكلمات المفتاحية أو الرموز أو العناوين داخلها.\n"
        "حدد المادة الدراسية المحتملة إن أمكن (مثال: رياضيات، علوم، لغة عربية، ...).\n"
        "أعد النتيجة في سطرين أو ثلاثة كحد أقصى بدون أي تنسيق خاص."
    )
    response = _invoke_vision_model(instructions, image_data_url, max_tokens=200)
    if not response:
        return "لم يتم الحصول على وصف للصورة."
    print(f"   -> (أداة) وصف الصورة: {response}...")
    
    # Save to Cache
    cache_description(data, response)
    return response

# ----------------------------------------------------------

@tool
def retrieve_documents(collection_name: str, search_query: str, subject: str = "", limit: int = 15) -> str:
    """
    يستخدم للبحث في كتب ومنهج الطالب (Vector Database) عن معلومات متعلقة بسؤاله.
    هذه الأداة هي المصدر الرئيسي للمعلومات الأكاديمية.
    
    Args:
        collection_name: اسم الكولكشن (مثال: g5_t1 للصف الخامس الترم الأول)
        search_query: سؤال البحث
        subject: المادة للفلترة (مثال: arabic, maths, english, science, social_studies)
        limit: عدد النتائج المطلوبة
    """
    print(f"... 🔍 (أداة) جارٍ البحث في '{collection_name}' عن '{search_query}' ...")
    if subject:
        print(f"   -> 🎯 فلترة حسب المادة: {subject}")
    
    if not qdrant_client or not embeddings:
        return "خطأ: خدمات البحث (Qdrant أو Embeddings) غير مهيأة."
        
    try:
        query_vector = embeddings.embed_query(search_query)
        
        # NEW: Create filter for subject if provided
        query_filter = None
        if subject:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="subject",
                        match=MatchValue(value=subject)
                    )
                ]
            )
        
        result = qdrant_client.query_points(
            collection_name=collection_name,
            query=query_vector,
            query_filter=query_filter,  # NEW: Apply subject filter
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
        results = getattr(result, "points", result)
        
        valid_docs = []
        for hit in results:
            content = hit.payload.get("page_content") or hit.payload.get("text")
            if content:
                valid_docs.append(Document(page_content=content, metadata=hit.payload))
        
        if not valid_docs:
            print("   -> (أداة) لم يتم العثور على مستندات مطابقة.")
            return "لم أجد مستندات مطابقة في المنهج."
            
        print(f"   -> (أداة) تم استرجاع {len(valid_docs)} مستند.")
        return "\n\n".join([d.page_content for d in valid_docs])
    
    except Exception as e:
        error_str = str(e)
        print(f"⚠️ (أداة) خطأ في الاسترجاع: {error_str}")
        if "Not found" in error_str or "does not exist" in error_str:
            return f"خطأ: الكولكشن '{collection_name}' غير موجود. تأكد من اسم المادة والصف."
        return f"حدث خطأ أثناء البحث: {error_str}"
    finally:
        if CURRENT_IMAGE_BASE64:
            print("... 🛑 (أداة) تم مسح بيانات الصورة من الذاكرة المؤقتة بعد الانتهاء.")
            # عدم حذف المتغير نفسه لأننا قد نحتاجه لاحقاً، فقط التذكير

# ----------------------------------------------------------

# (الأداة 3: البحث على الويب - جديدة)
if TAVILY_API_KEY:
    web_search_tool = TavilySearchResults(
        max_results=3, 
        tavily_api_key=TAVILY_API_KEY,
        name="web_search"
    )
    web_search_tool.description = "أداة للبحث على الإنترنت عن معلومات عامة، أحداث جارية، أو أسئلة لا تخص المنهج الدراسي."
    print("✅ Web Search (Tavily): جاهز.")
else:
    print("ℹ️ Web Search (Tavily): لم يتم العثور على API Key، الأداة معطلة.")
    web_search_tool = None

# --- تجميع الأدوات ---
tools = [describe_image, retrieve_documents]
if web_search_tool:
    tools.append(web_search_tool)
    
# ربط الأدوات بالـ LLM
llm_with_tools = llm.bind_tools(tools)

# ==========================================================
# 🔹 🧠 System Prompt (عقل الـ Agent)
# ==========================================================
SYSTEM_PROMPT = """أنت "مساعد تعليمي" ذكي وخبير. مهمتك هي مساعدة الطلاب بالإجابة على أسئلتهم التعليمية.

لديك مجموعة من "الأدوات" لمساعدتك. في كل خطوة، فكر جيداً وقرر:
1.  هل تحتاج لاستخدام أداة؟
2.  أم لديك معلومات كافية للإجابة النهائية؟

## بيانات الطالب الحالية:
{student_meta}

## ذاكرة الطالب (محادثات سابقة):
{memory}

## ⚡ قواعد صارمة وخطة العمل ⚡

-   إذا أرفق الطالب صورة (`image_base64` موجود) ولم يكن لديك وصف مسبق، استخدم أداة `describe_image` لفهم محتواها (يكفي أن تستدعي `describe_image()` بدون تمرير معلمات، وستتم تهيئة الصورة لك تلقائيًا).
-   في حال تم توفير وصف مسبق للصورة في قسم "وصف الصورة"، اعتبر أنك شاهدت الصورة بالفعل، ولا تطلب إعادة تحميلها أو تكرار الطلب من الطالب.
-   استخدم وصف الصورة مع نص السؤال في الخطوات التالية.

### الخطوة 2: تحليل السؤال والمنهج (الأولوية القصوى)
-   **هذه هي الخطوة الأهم.** يجب عليك أن تقرر: هل هذا سؤال "أكاديمي" (يخص المنهج) أم "عام" (يخص العالم الخارجي)؟
-   **إذا كان أكاديمياً (الأولوية):**
    1.  **استنتج المادة:** من نص السؤال (ووصف الصورة)، **يجب عليك استنتاج** المادة الدراسية.
        -   المواد المتاحة: `['arabic', 'maths', 'english', 'science', 'social_studies']`.
    2.  **كوّن اسم الكولكشن:** استخدم صيغة `g{{grade}}_t{{term}}` (مثال: طالب بـ `grade: 5`, `term: 1` -> `g5_t1`).
    3.  **كوّن سؤال البحث:** أعد صياغة سؤال الطالب (ووصف الصورة إن وجد) ليصبح `search_query` ممتاز.
    4.  **استدعِ الأداة:** استدعِ `retrieve_documents` مع الـ `collection_name` والـ `search_query` والـ `subject` (المادة المستنتجة).
-   **إذا كان عاماً (مثل "ما عاصمة فرنسا؟"):**
    -   انتقل مباشرة للخطوة 3.

### الخطوة 3: البحث على الويب (خطة بديلة)
-   **لا تستخدم `web_search` إلا في إحدى الحالتين:**
    1.  إذا كان السؤال "عاماً" بوضوح (كما في الخطوة 2).
    2.  **أو** إذا فشلت الخطوة 2 (أداة `retrieve_documents` أرجعت "لم أجد مستندات" أو "الكولكشن غير موجود").
-   في هذه الحالة، استخدم `web_search` كمحاولة ثانية للحصول على سياق عام.

### الخطوة 4: صياغة الإجابة النهائية
-   **فقط بعد** حصولك على "سياق" (Context) (إما من `retrieve_documents` أو `web_search`)، قم بصياغة إجابة نهائية.
-   **ممنوع** الإجابة "من رأسك" أو من معلوماتك العامة بدون سياق.
-   اشرح بأسلوب سهل وواضح يناسب عمر الطالب (انظر `student_meta`). إذا كانت الصورة تحتوي أسئلة واختيارات، حلها واحداً تلو الآخر وقدّم الإجابات مع تبرير مختصر.
-   **وضح مصدرك:** إذا كانت الإجابة من المنهج، قل "حسب المنهج الدراسي...". إذا كانت من الويب، قل "بحسب المعلومات العامة...".
-   استخدم الأرقام الإنجليزية (0-9) دائماً.
-   استخدم نفس لغة سؤال الطالب (إن كان بالعربية فأجب بالعربية، وإن كان بالإنجليزية فأجب بالإنجليزية).

## وصف الصورة (إن وجد):
{image_description}

"""

# ==========================================================
# 🔹 📈 State Definition
# ==========================================================

class AgentState(TypedDict):
    # أهم حقل: قائمة الرسائل لتتبع المحادثة
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]
    # معلومات الطالب الثابتة
    student_meta: dict
    # ذاكرة المحادثات السابقة
    memory: str
    # بيانات الصورة (إن وجدت)
    image_base64: Optional[str]
    image_description: str
    question: str
    # الإجابة النهائية (لتحديث الذاكرة)
    final_answer: str

# ==========================================================
# 🔹 🔄 Graph Nodes and Edges
# ==========================================================

def agent_node(state: AgentState):
    """العقل المفكر: يقرر الخطوة التالية (أداة أم إجابة)"""
    print("\n--- 🧠 (Agent) يفكر ---")
    
    current_messages = state["messages"]

    # استدعاء الـ LLM (العقل)
    response: AIMessage = llm_with_tools.invoke(current_messages)
    
    # طباعة قرار الـ Agent
    if response.tool_calls:
        print(f"   -> 🎯 (Agent) قرر استدعاء: {[tc['name'] for tc in response.tool_calls]}")
    else:
        print("   -> ✅ (Agent) قرر الإجابة مباشرة.")
        if state.get("image_base64") and openrouter_client:
            retrieved_context = _collect_tool_context(current_messages)
            question_text = state.get("question") or ""
            memory_text = state.get("memory", "")
            vision_answer = _generate_vision_final_answer(
                question=question_text,
                student_meta=state.get("student_meta", {}),
                memory_text=memory_text,
                retrieved_context=retrieved_context,
                image_description=state.get("image_description", ""),
                image_base64=state.get("image_base64"),
            )
            if vision_answer:
                print("   -> 🖼️ تم استخدام نموذج الرؤية لصياغة الإجابة النهائية.")
                response = AIMessage(content=vision_answer)
            else:
                print("   -> ⚠️ تعذر استخدام نموذج الرؤية، سيتم الاعتماد على إجابة الـ LLM النصي.")
        
    return {"messages": [response], "final_answer": response.content}


def should_continue(state: AgentState) -> str:
    """يقرر: هل نعود للعقل أم ننتهي؟"""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        # إذا كان الـ LLM يطلب أدوات، اذهب لعقدة الأدوات
        return "tools" 
    else:
        # إذا لم يطلب أدوات (قدم إجابة نهائية)، انهِ
        return END

# عقدة تنفيذ الأدوات الجاهزة من LangGraph
tool_node_executor = ToolNode(tools)

def build_agentic_graph():
    """بناء الـ Graph الخاص بالـ Agent"""
    g = StateGraph(AgentState)
    
    # 1. العقد
    g.add_node("agent", agent_node) # العقل المفكر
    g.add_node("tools", tool_node_executor) # منفذ الأدوات

    # 2. المسار
    g.set_entry_point("agent") # ابدأ دائماً بالتفكير
    
    # 3. الرابط الشرطي
    g.add_conditional_edges(
        "agent", # بعد عقدة "العقل"
        should_continue, # اسأل هذا الشرط
        {
            "tools": "tools", # لو "tools"، اذهب لعقدة الأدوات
            END: END          # لو "END"، انهِ
        }
    )
    
    # 4. الحلقة (Loop)
    g.add_edge("tools", "agent") # بعد تنفيذ الأدوات، ارجع "للعقل" ليفكر مجدداً بالنتائج

    print("\n🚀 تم بناء Agentic Graph بنجاح.")
    return g.compile()

# ==========================================================
# 🔹 Deployment Function (المنفذ)
# ==========================================================
def run_agentic_rag(
    question: str,
    student_meta: dict,
    image_base64: str | None = None,
    mode_flag: int = 0,
    web_search_flag: int = 0,
):
    global CURRENT_IMAGE_BASE64
    
    # (التأكد من جاهزية الخدمات)
    if not all([qdrant_client, embeddings, llm]):
        print("❌ لا يمكن التشغيل. واحد أو أكثر من الخدمات الأساسية (Qdrant, Embeddings, LLM) فشل في التهيئة.")
        return {"error": "الخدمات الأساسية غير جاهزة."}

    # Auto-detect term if not provided
    if "term" not in student_meta or not student_meta["term"]:
        student_meta["term"] = get_current_term()
        print(f"🗓️ تم تحديد الترم تلقائياً: الترم {student_meta['term']}")

    CURRENT_IMAGE_BASE64 = image_base64

    # (بناء التطبيق)
    app = build_agentic_graph()
    
    # (1. تحميل الذاكرة)
    name = student_meta.get("name", "local")
    memory_text = load_student_memory(name)
    print(f"--- 🧠 تحميل ذاكرة الطالب {name} ({len(memory_text)} حرف) ---")

    # (2. تجهيز الحالة الأولية)
    image_description = ""
    if image_base64:
        CURRENT_IMAGE_BASE64 = image_base64
        print("🖼️ محاولة استخراج وصف للصورة قبل تشغيل الـ Agent...")
        image_data_url = _format_image_data(image_base64)
        
        # Check Cache First
        cached_desc = get_cached_description(image_base64)
        if cached_desc:
             print(f"   -> ✅ تم العثور على وصف الصورة في الكاش: {cached_desc[:50]}...")
             image_description = cached_desc
        elif image_data_url and openrouter_client:
            description_prompt = (
                "أنت محلل يساعد في فهم الصور التعليمية.\n"
                "أعطني وصفًا موجزًا باللغة العربية لما يظهر في الصورة، مع التركيز على الكلمات المفتاحية أو الرموز أو العناوين داخلها.\n"
                "حدد المادة الدراسية المحتملة إن أمكن (مثال: رياضيات، علوم، لغة عربية، ...).\n"
                "أعد النتيجة في سطرين أو ثلاثة كحد أقصى بدون أي تنسيق خاص."
            )
            described = _invoke_vision_model(description_prompt, image_data_url, max_tokens=200)
            if described and "خطأ" not in described:
                image_description = described.strip()
                print(f"   -> تم استخراج وصف مبدئي للصورة ({len(image_description)} حرف).")
                # Save to Cache
                cache_description(image_base64, image_description)
            else:
                print("   -> تعذر استخراج وصف تلقائي للصورة، سيحاول الـ Agent استخدام الأداة.")
        else:
            print("   -> لا يمكن استدعاء نموذج الرؤية الآن، سيعتمد الـ Agent على الأدوات أثناء التنفيذ.")

    meta_str = json.dumps(student_meta, ensure_ascii=False)
    
    # Hybrid Search Logic
    current_system_prompt = SYSTEM_PROMPT
    if web_search_flag == 1:
        current_system_prompt += """

## ⚠️ تنبيه هام: وضع البحث على الويب مفعل ⚠️
لقد قام المستخدم بتفعيل خيار "البحث على الويب".
- إذا كان السؤال أكاديمياً: **يجب** عليك استخدام أداة `retrieve_documents` أولاً، **ثم** استخدام أداة `web_search` للحصول على معلومات إضافية. ادمج المعلومات من المصدرين.
- إذا كان السؤال عاماً: استخدم `web_search` مباشرة.
"""

    system_message = SystemMessage(
        content=current_system_prompt.format(
            student_meta=meta_str,
            memory=memory_text or "لا توجد ذاكرة بعد.",
            image_description=image_description or "[لا يوجد وصف للصورة]",
        )
    )
    human_parts = [question.strip() or ""]
    if image_description:
        human_parts.append(f"[وصف الصورة]: {image_description}")
    elif image_base64:
        human_parts.append("[صورة مرفقة]")
    human_message = HumanMessage(content="\n".join(part for part in human_parts if part))

    initial_messages = [system_message, human_message]
    init_state: AgentState = {
        "messages": initial_messages,
        "student_meta": student_meta,
        "memory": memory_text,
        "image_base64": image_base64,
        "image_description": image_description,
        "question": question,
        "final_answer": "",
    }
    
    # (3. تشغيل الـ Agent)
    print(f"\n--- 🚀 بدء تشغيل الـ Agent للسؤال: '{question[:40]}...' ---")
    final_state = app.invoke(init_state)
    
    # (4. استخراج الإجابة النهائية)
    final_answer = final_state.get("final_answer", "لم يتمكن المساعد من الوصول لإجابة.")
    if not final_answer:
        # (محاولة أخيرة لاستخراجها من الرسائل إذا فشل التعيين)
        if final_state["messages"][-1] and isinstance(final_state["messages"][-1], AIMessage):
            final_answer = final_state["messages"][-1].content
            
    print("\n" + "=" * 50)
    print("🎉 النتيجة النهائية (Agentic):")
    print(f"الإجابة:\n{final_answer}")
    print("=" * 50)
    
    # (5. تحديث الذاكرة)
    print("💾 تحديث الذاكرة (مع التلخيص الذكي)...")
    summary_of_answer = summarize_for_memory(final_answer)
    new_summary = update_memory(memory_text, question, summary_of_answer, image_description)
    save_student_memory(name, new_summary)
    CURRENT_IMAGE_BASE64 = None
    return final_state

# ==========================================================
# 🔹 Local Deploy (للتجربة)
# ==========================================================
if __name__ == "__main__":
    # (بيانات الطالب)
    student_meta = {"grade": "4", "term": "1", "name": "Omar", "age": "11"}

    # # --- تجربة 1: سؤال إنجليزي (يجب أن يستنتج 'english') ---
    # print("\n" + "#" * 50)
    # print("### تجربة 1: سؤال إنجليزي (English)")
    # print("#" * 50)
    # question_en = "write a short paragraph about your favourite meal"
    # run_agentic_rag(question_en, student_meta)

    # --- تجربة 2: سؤال رياضيات (يجب أن يستنتج 'maths') ---
    print("\n" + "#" * 50)
    print("### تجربة 2: سؤال رياضيات (Maths)")
    print("#" * 50)
    question_math = "اشرح لي الضرب بالتجزئه مع مثال على ذلك."
    run_agentic_rag(question_math, student_meta)

    # # --- تجربة 3: سؤال عام (يجب أن يستخدم 'web_search') ---
    # print("\n" + "#" * 50)
    # print("### تجربة 3: سؤال عام (Web Search)")
    # print("#" * 50)
    # question_general = "ما هي عاصمة البرازيل؟"
    # run_agentic_rag(question_general, student_meta)
