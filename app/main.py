# main.py
from rag import run_standard_rag
from agentic_rag import run_agentic_rag


def run_agentic_pipeline(
    question: str,
    student_meta: dict | None = None,
    mode_flag: int = 0,
    web_search_flag: int = 0,
    image_base64: str | None = None,
):
    """
    Unified entry point.
    mode_flag:
        0 →  RAG (العادي)
        1 →  Agentic_RAG (تفكير عميق)
    """

    student_meta = student_meta or {"grade": "6", "term": "1", "name": "Guest"}

    # Force Agentic Mode if Web Search is requested
    if web_search_flag == 1:
        mode_flag = 1

    if mode_flag == 1:
        # تشغيل التفكير العميق
        print("🧠 تشغيل نظام التفكير العميق ...")
        state = run_agentic_rag(question, student_meta, image_base64=image_base64, web_search_flag=web_search_flag)
        answer_text = (
            state.get("final_answer")
            or state.get("answer")
            or state.get("messages", [])[-1].content
            if state.get("messages")
            else "لم يتم العثور على إجابة."
        )
        return {
            "answer": answer_text,
            "mode": "Agentic_RAG",
            "state": state,
        }

    # otherwise: التشغيل العادي
    print("🌿 تشغيل نظام RAG العادي...")
    state = run_standard_rag(question, student_meta, image_base64=image_base64)
    answer_text = state.get("answer", "لم يتم العثور على إجابة.")

    return {
        "answer": answer_text,
        "mode": "RAG",
        "state": state,
    }


if __name__ == "__main__":
    # question = "صنف الجمل الاتيه الى جمل اسمية و جمل فعلية : (الطالب مجتهد - يذاكر الطالب دروسه - السماء صافية - يلعب الأطفال في الحديقة)"
    question = "../Screenshot from 2025-10-15 22-44-35.png"
    student_meta = {"grade": "5", "term": "1", "name": "ali"}

    # 👇 بدل هنا بس حسب الزرار أو الإعداد
    # 0 → RAG , 1 → Agentic_RAG (Deep Thinking)
    mode_flag = 1

    result = run_agentic_pipeline(question, student_meta, mode_flag)
    print("\النظام المستخدم:", result["mode"])
    print("الإجابة:", result["answer"])
