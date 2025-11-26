import base64
import os
import json
from pathlib import Path
import re
from typing import TypedDict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from qdrant_client import QdrantClient
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from openai import OpenAI

# ==========================================================
# 🔹 .ENV
# ==========================================================
ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
load_dotenv(ENV_PATH)

# ==========================================================
# 🔹.Env Keys
# ==========================================================
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_CHAT_MODEL = os.getenv("DEEPSEEK_CHAT_MODEL", "deepseek-chat")

QDRANT_URL = os.getenv("URL_QDRANT")
QDRANT_API_KEY = os.getenv("API_KEY_QDRANT")
HF_API_KEY = os.getenv("HUGGINGFACEHUB_API_TOKEN")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE = os.getenv("OPENROUTER_BASE", "https://openrouter.ai/api/v1")
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "meta-llama/llama-3.2-90b-vision-instruct")
OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER", "")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE", "")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ==========================================================
# 🔹 Clients and Embeddings
# ==========================================================
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)


embeddings = HuggingFaceEndpointEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2",
    huggingfacehub_api_token=(HF_API_KEY)
)

llm = ChatOpenAI(
    openai_api_key=DEEPSEEK_API_KEY,
    openai_api_base=DEEPSEEK_BASE_URL,
    model=DEEPSEEK_CHAT_MODEL,
    temperature=0.2,
)

# llm = ChatGroq(
#     api_key=GROQ_API_KEY,
#     model="openai/gpt-oss-120b")

openrouter_client: Optional[OpenAI] = None
openrouter_headers: dict[str, str] = {}
if OPENROUTER_API_KEY:
    try:
        openrouter_client = OpenAI(base_url=OPENROUTER_BASE, api_key=OPENROUTER_API_KEY)
        if OPENROUTER_REFERER:
            openrouter_headers["HTTP-Referer"] = OPENROUTER_REFERER
        if OPENROUTER_TITLE:
            openrouter_headers["X-Title"] = OPENROUTER_TITLE
    except Exception as exc:
        print(f"⚠️ تعذر تهيئة عميل OpenRouter: {exc}")

# ==========================================================
# 🔹 Student Memory
# ==========================================================
MEMORY_DIR = ROOT / "memory_store"
MEMORY_DIR.mkdir(exist_ok=True)


def load_student_memory(name: str) -> str:
    path = MEMORY_DIR / f"{name}.json"
    if not path.exists():
        return ""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("summary", "")
    except Exception:
        return ""


def save_student_memory(name: str, summary: str):
    path = MEMORY_DIR / f"{name}.json"
    path.write_text(json.dumps({"summary": summary}, ensure_ascii=False, indent=2), encoding="utf-8")


def update_memory(old: str, question: str, answer: str) -> str:
    text = f"سأل الطالب: {question[:200]}\nأجاب المساعد: {answer[:300]}"
    merged = (old.strip() + "\n" + text).strip()
    return merged[-2000:]


def _format_image_data(image_base64: Optional[str]) -> Optional[str]:
    if not image_base64:
        return None
    image_base64 = image_base64.strip()
    if not image_base64:
        return None
    if image_base64.startswith("data:image"):
        return image_base64
    return f"data:image/png;base64,{image_base64}"


def _invoke_vision_model(prompt: str, image_data_url: str, max_tokens: int = 600) -> Optional[str]:
    if openrouter_client:
        try:
            response = openrouter_client.chat.completions.create(
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
                return result
        except Exception as exc:
            print(f"⚠️ تعذر استخدام نموذج الرؤية عبر OpenRouter: {exc}")

    return None

# ==========================================================
# 🔹 State Definition 
# ==========================================================
class AgentState(TypedDict):
    question: str
    student_meta: dict
    analysis: str
    collection_name: str
    search_query: str
    context_prompt: str
    retrieved_docs: List[Document]
    answer: str
    confidence: float
    reasoning: str
    attempts: int
    summary: str
    memory: str
    image_base64: Optional[str]
    image_description: str

# ==========================================================
# 🔹 LangGraph Nodes
# ==========================================================
def memory_node(state: AgentState) -> AgentState:
    name = state["student_meta"].get("name", "local")
    memory_text = load_student_memory(name)
    print(f"0. 🧠 تحميل الذاكرة السابقة للطالب {name}: {len(memory_text)} حرف")
    return {
        "memory": memory_text,
        "search_query": state["question"],
        "retrieved_docs": [],
        "image_description": state.get("image_description", ""),
    }


def vision_describe_node(state: AgentState) -> AgentState:
    image_data_url = _format_image_data(state.get("image_base64"))
    if not image_data_url or not openrouter_client:
        return {}

    print("0.5 🖼️ استخراج وصف من الصورة المرفقة...")
    instructions = (
        "أنت محلل يساعد في فهم الصور التعليمية.\n"
        "أعطني وصفًا موجزًا باللغة العربية لما يظهر في الصورة، مع التركيز على الكلمات المفتاحية أو الرموز أو العناوين داخلها.\n"
        "حدد المادة الدراسية المحتملة إن أمكن (مثال: رياضيات، علوم، لغة عربية، ...).\n"
        "أعد النتيجة في سطرين أو ثلاثة كحد أقصى بدون أي تنسيق خاص."
    )
    response = _invoke_vision_model(instructions, image_data_url, max_tokens=200)
    if not response:
        print("⚠️ لم يتم الحصول على وصف للصورة. سيتم المتابعة بدون وصف.")
        return {}

    if not response:
        return {}

    print("   -> وصف مختصر للصورة:", response)
    combined_query = state["question"].strip()
    if response:
        combined_query = (combined_query + " " + response).strip()

    return {
        "image_description": response,
        "search_query": combined_query or state["question"],
    }


def analyze_node(state: AgentState) -> AgentState:
    print("1. 🧠 تحليل السؤال وتحديد المادة...")
    # هنا نترك DeepSeek يحدد المادة
    image_hint = (state.get("image_description") or "").strip()
    prompt = f"""
    تحليل سؤال طالب لتحديد المادة الدراسية المناسبة.

    السؤال: {state['question']}
    بيانات الطالب: {state['student_meta']}
    { 'وصف الصورة: ' + image_hint if image_hint else ''}

    المطلوب منك:
    - استنتج المادة الدراسية التي ينتمي إليها السؤال.
    - استخدم فقط القيم المحددة التالية بدقة في الحقل 'subject_en':
    ['arabic', 'maths', 'english', 'science', 'social_studies', 'general']
    - لا تكتب أي كلمات إضافية أو توصيفات (مثل "grammar" أو "reading" أو "math").
    - أعد الناتج بصيغة JSON فقط، من دون أي نص آخر.

    مثال على المخرجات الصحيحة:
    {{
    "subject_en": "maths",
    "analysis_notes": "هذا السؤال يتحدث عن المضاعف المشترك الأصغر في مادة الرياضيات."
    }}
    """
    try:
        res = llm.invoke(prompt).content
        json_match = re.search(r"\{.*\}", res, re.DOTALL)
        data = json.loads(json_match.group(0)) if json_match else {}
    except Exception as e:
        print(f"⚠️ فشل تحليل المادة: {e}")
        data = {}

    allowed_subjects = {"arabic", "maths", "english", "science", "social_studies"}
    subject_en = data.get("subject_en", "maths").lower().strip()
    if subject_en not in allowed_subjects:
        print(f"   -> موضوع غير معروف '{subject_en}'، سيتم استخدام maths افتراضياً.")
        subject_en = "maths"
    grade = state["student_meta"].get("grade", "1")
    term = state["student_meta"].get("term", "1")
    collection_name = f"{subject_en}_g{grade}_t{term}"
    search_query = data.get("analysis_notes", state["question"])
    print(f"   -> المادة: {subject_en} | الكوليكشن: {collection_name}")
    return {
        "analysis": res,
        "collection_name": collection_name,
        "search_query": search_query,
        "attempts": 0,
    }

# ----------------------------------------------------------
def retrieve_node(state: AgentState) -> AgentState:
    """استرجاع المستندات من Qdrant مع زيادة عدد المستندات تدريجيًا"""
    current_attempt = state["attempts"]
    print(f"2. 🔍 استرجاع البيانات (المحاولة {current_attempt + 1})...")
    
    # زيادة عدد المستندات تدريجيًا: 5 → 10 → 15
    limit = min(10 + current_attempt * 10, 30)

    image_hint = state.get("image_description", "")
    base_query = (state["search_query"] or state["question"]).strip()
    base_query = (base_query + " " + image_hint).strip() if image_hint else base_query

    if current_attempt == 1:
        search_query = f"{state['question']} شرح مختصر"
    elif current_attempt == 2:
        search_query = f"معلومة من الدرس حول: {state['question']}"
    else:
        search_query = base_query or state["question"]

    if image_hint:
        search_query = (search_query + " " + image_hint).strip()

    valid_docs = []
    try:
        query_vector = embeddings.embed_query(search_query)
        results = qdrant_client.query_points(
            collection_name=state["collection_name"],
            query=query_vector,
            limit=limit,
            with_payload=True,
        ).points
        for hit in results:
            content = hit.payload.get("page_content") or hit.payload.get("text")
            if content:
                valid_docs.append(Document(page_content=content, metadata=hit.payload))
        print(f"   -> تم استرجاع {len(valid_docs)} مستند (الحد الحالي: {limit})")
    except Exception as e:
        print(f"⚠️ خطأ في الاسترجاع: {e}")

    return {"retrieved_docs": valid_docs, "search_query": search_query}

# ----------------------------------------------------------
def generate_node(state: AgentState) -> AgentState:
    attempt = state["attempts"] + 1
    print(f"3. 💬 توليد الإجابة (المحاولة {attempt})...")
    retrieved_context = "\n\n".join([d.page_content for d in state["retrieved_docs"]]) or "لا توجد بيانات من المنهج."
    memory = (state.get("memory") or "").strip()
    context_prompt = (state.get("context_prompt") or state["question"]).strip()
    image_data_url = _format_image_data(state.get("image_base64"))

    context_sections = []
    if memory:
        context_sections.append(f"ملخص المحادثات السابقة:\n{memory}")
    if context_prompt:
        context_sections.append(f"السياق الحالي:\n{context_prompt}")
    if state.get("image_description"):
        context_sections.append(f"وصف الصورة:\n{state['image_description']}")
    context_sections.append(f"النصوص المسترجعة:\n{retrieved_context}")
    combined_context = "\n\n".join(context_sections)
    prompt = f"""
أنت معلم ذكي وصبور تشرح المفاهيم للأطفال بطريقة مبسطة ومفهومة.

المطلوب منك:
- اشرح بأسلوب سهل وواضح يناسب عمر الطالب.
- لو المصطلح صعب، عرّفه بكلمتين بسيطتين وأعطِ مثالًا صغيرًا من السياق.
- لو السؤال مسألة رياضية، اشرح خطوات الحل باختصار (المعطيات → القاعدة → الحل).
- أضف في النهاية دائمًا مثالًا توضيحيًا عمليًا أو بسيطًا يساعد الطالب على الفهم. 
  (مثلاً: مثال من الحياة اليومية، أو مسألة عددية صغيرة، أو مقارنة سهلة.)
- استخدم **الأرقام الإنجليزية فقط (0–9)** في جميع الأجزاء، حتى داخل النص العربي.


السؤال: {state['question']}
بيانات الطالب: {state['student_meta']}
السياق:
{combined_context}

أجب بصيغة JSON منظمة كما يلي:
{{
  "answer": "الإجابة النهائية بلغة بسيطة وواضحة للطالب",
  "confidence": "درجة الثقة من 1 إلى 10 (عدد صحيح أو عشري)",
  "reasoning": "ملخص تفكيرك في الحل أو سبب الإجابة"
}}
"""
    if image_data_url:
        prompt += "\n[ملاحظة عن الصورة]\nيوجد صورة مرفقة من الطالب. استخرج أي نص أو معطيات مهمة من الصورة، ثم استخدم المراجع المسترجعة للتحقق قبل صياغة الإجابة.\n"
    res = None
    if image_data_url and openrouter_client:
        print("   -> 🖼️ محاولة استخدام نموذج الرؤية عبر OpenRouter بسبب وجود صورة.")
        res = _invoke_vision_model(prompt, image_data_url, max_tokens=700)
        if res:
            print("   -> ✅ تم توليد الإجابة باستخدام نموذج الرؤية.")
        else:
            print("⚠️ لم ينجح نموذج الرؤية، سيتم استخدام النموذج النصي.")

    if not res:
        try:
            res = llm.invoke(prompt, max_tokens=700).content
        except Exception as exc:
            print(f"⚠️ خطأ أثناء التوليد: {exc}")
            return {
                "answer": "حدث خطأ أثناء التوليد.",
                "confidence": 0,
                "reasoning": str(exc),
                "attempts": attempt,
            }

    match = re.search(r"\{.*\}", res, re.DOTALL)
    data = json.loads(match.group(0)) if match else {"answer": res, "confidence": "5", "reasoning": "no JSON"}
    confidence = float(str(data.get("confidence", 0)).replace(",", "."))
    print(f"   -> الثقة: {confidence:.1f}/10")
    return {
        "answer": data.get("answer", ""),
        "confidence": confidence,
        "reasoning": data.get("reasoning", ""),
        "attempts": attempt,
    }

# ----------------------------------------------------------
def summarize_node(state: AgentState) -> AgentState:
    print("4. 📝 توليد ملخص للإجابة...")
    answer_text = (state.get("answer") or "").strip()
    if not answer_text:
        summary_text = "لا توجد إجابة لتلخيصها."
    else:
        prompt = f"""
ألخص إجابة تعليمية باللغة العربية في فقرة قصيرة لا تتجاوز 3 جمل. 
يجب أن يكون الملخص مناسبًا لطالب في المدرسة الابتدائية، ويعيد جملة "المعلومات غير كافية من الكتاب." كما هي إن ظهرت في الإجابة.

الإجابة الأصلية:
{answer_text}
"""
        try:
            summary_text = llm.invoke(prompt).content.strip()
        except Exception as e:
            summary_text = f"تعذر توليد الملخص: {e}"

    print("--------------------------------------------------")
    print("الملخص:")
    print(summary_text)
    print("--------------------------------------------------")
    return {"summary": summary_text}


def update_memory_node(state: AgentState) -> AgentState:
    print("6. 💾 تحديث ذاكرة الطالب...")
    name = state["student_meta"].get("name", "local")
    old_memory = state.get("memory", "")
    question = state["question"]
    answer = state.get("answer", "")
    new_summary = update_memory(old_memory, question, answer)
    save_student_memory(name, new_summary)
    print(f"   -> تم حفظ الذاكرة ({len(new_summary)} حرف).")
    return {"memory": new_summary}

# ----------------------------------------------------------
def decide_to_retry(state: AgentState) -> str:
    c, a = state["confidence"], state["attempts"]
    print(f"5. 🎯 تقييم الثقة: {c:.1f}/10 (المحاولة {a}/3)")
    if c >= 8.5:
        print("   -> ✅ الثقة ≥ 85%. الانتقال إلى التلخيص.")
        return "summarize"
    if a >= 3:
        print("   -> ❌ الحد الأقصى للمحاولات. إنهاء.")
        return "end"
    print("   -> 🔄 الثقة أقل من 85%. إعادة المحاولة.")
    return "retrieve"

# ==========================================================
# 🔹 LangGraph Building
# ==========================================================
def build_rag_graph():
    g = StateGraph(AgentState)
    g.add_node("memory", memory_node)
    g.add_node("vision", vision_describe_node)
    g.add_node("analyze", analyze_node)
    g.add_node("retrieve", retrieve_node)
    g.add_node("generate", generate_node)
    g.add_node("summarize", summarize_node)
    g.add_node("update_memory", update_memory_node)
    g.set_entry_point("memory")
    g.add_edge("memory", "vision")
    g.add_edge("vision", "analyze")
    g.add_edge("analyze", "retrieve")
    g.add_edge("retrieve", "generate")
    g.add_conditional_edges(
        "generate",
        decide_to_retry,
        {
            "retrieve": "retrieve",
            "summarize": "summarize",
            "end": END,
        },
    )
    g.add_edge("summarize", "update_memory")
    g.add_edge("update_memory", END)
    return g.compile()

# ==========================================================
# 🔹 Deployment Function
# ==========================================================
def run_agent(
    question: str,
    student_meta: dict,
    context_prompt: str | None = None,
    image_base64: str | None = None,
):
    app = build_rag_graph()
    init_state: AgentState = {
        "question": question,
        "student_meta": student_meta,
        "analysis": "",
        "collection_name": "",
        "search_query": "",
        "context_prompt": context_prompt or question,
        "retrieved_docs": [],
        "answer": "",
        "confidence": 0.0,
        "reasoning": "",
        "attempts": 0,
        "summary": "",
        "memory": "",
        "image_base64": image_base64,
        "image_description": "",
    }
    final = app.invoke(init_state)
    
    print("\n" + "=" * 50)
    print("🎉 النتيجة النهائية:")
    print("=" * 50)
    print(f"السؤال: {final['question']}")
    print(f"الثقة النهائية: {final['confidence']:.1f}/10")
    print(f"الإجابة:\n{final['answer']}")
    print(f"السبب:\n{final['reasoning']}")
    print(f"الملخص:\n{final['summary']}")
    print("=" * 50)
    return final

# ==========================================================
# 🔹 Local Deploy
# ==========================================================
if __name__ == "__main__":
    student_meta = {"grade": "5", "term": "1", "name": "Omar", "age": "11"}
    question = "write a short paragraph about your favourite meal"
    run_agent(question, student_meta)
