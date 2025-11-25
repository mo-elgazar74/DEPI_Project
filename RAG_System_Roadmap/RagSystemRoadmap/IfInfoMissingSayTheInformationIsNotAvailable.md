---
id: rag-system-roadmap-system-prompt-design-if-info-missing-say-the-information-is-not-available_ed569419
type: leaf
parent: RagSystemRoadmap/SystemPromptDesign.md
children:
prereqs:
  - RagSystemRoadmap/AnswerOnlyFromContext.md
  - RagSystemRoadmap/AddShortFriendlyExamples.md
  - RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md
  - RagSystemRoadmap/SameLanguageAsQuestion.md
see_also:
  - RagSystemRoadmap/SystemPromptDesign.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: A system prompt is a set of initial instructions that defines an AI's persona, rules, and output format, acting as a crucial guide for ensuring consistent, high-quality, and safe responses within a [[RagSystemRoadmap|RAG System]].
model: provider/model
run_id: manual
---

# If info missing → say “The information is not available.”

## Summary

A system prompt is a set of initial instructions that defines an AI's persona, rules, and output format, acting as a crucial guide for ensuring consistent, high-quality, and safe responses within a [[RagSystemRoadmap/RagSystemRoadmap.md|RAG System]].

## Key concepts

*   **Persona Definition**: This establishes the AI's role and expertise, such as a friendly tutor or a technical expert, which shapes the tone and style of all answers. For example, the [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|ALI5 Mode]] configures the AI to explain concepts like the user is five years old.
*   **Rule Enforcement**: These are non-negotiable directives that govern the AI's behavior, like [[RagSystemRoadmap/AnswerOnlyFromContext.md|Answer Only From Context]] to prevent hallucination or [[RagSystemRoadmap/SameLanguageAsQuestion.md|responding in the same language as the question]].
*   **Output Structuring**: This defines the format of the final answer, ensuring consistency and usability, such as requiring the use of [[RagSystemRoadmap/DisplayCitationsSourcePage.md|citations]] or [[RagSystemRoadmap/AddShortFriendlyExamples.md|short, friendly examples]].
*   **Context Integration**: The prompt must explicitly tell the AI how to use the provided [[RagSystemRoadmap/ContextConstruction.md|retrieved context]], typically through a placeholder like the one defined in [[RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md|System Prompt User Question Retrieved Context]].

## Why it matters

*   **Controls Hallucination**: A well-crafted prompt with a strict [[RagSystemRoadmap/AnswerOnlyFromContext.md|Answer Only From Context]] rule forces the AI to base its answers solely on the provided information, drastically reducing made-up facts.
*   **Ensures Consistency**: By defining a persona and output format, every interaction feels like it's coming from the same, reliable source, which is critical for user trust in an educational [[RagSystemRoadmap/ChatStyleQAInterface.md|Chat Style QA Interface]].
*   **Improves Relevance**: The prompt guides the AI to prioritize information from the [[RagSystemRoadmap/BuildUnifiedContext.md|unified context]], leading to answers that are directly relevant to the user's query and the system's knowledge base.
*   **Enables Specialization**: Through [[RagSystemRoadmap/PromptComposition.md|Prompt Composition]], you can create highly specialized agents for different tasks, like a math tutor that always [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md|preserves mathematical notation]] or a summarization agent.

## Core steps

*   **Define the AI's primary goal and persona** to set the foundational tone and expertise, ensuring the AI understands its role, such as an educational assistant for the [[RagSystemRoadmap/Goal.md|system's goal]].
    *   *Example*: `"You are ALI5, a friendly and patient tutor who explains complex topics in simple, easy-to-understand language suitable for a 5-year-old."`
*   **Incorporate the rule to [[RagSystemRoadmap/AnswerOnlyFromContext.md|Answer Only From Context]]** to prevent the model from using its internal knowledge, which is essential for factuality and avoiding misinformation.
    *   *Example*: `"STRICTLY use ONLY the information provided in the 'Context' section below. If the answer cannot be found in the context, you must say 'The information is not available.'"`
*   **Integrate the user's question and the retrieved context** using a structured template that clearly separates instructions from inputs, as defined in [[RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md|System Prompt User Question Retrieved Context]].
    *   *Example*:
        ````
        Context: {retrieved_context}
        Question: {user_question}
        ````
*   **Specify the desired output format** to ensure usability, requiring elements like citations from [[RagSystemRoadmap/DisplayCitationsSourcePage.md|Display Citations Source Page]] or an [[RagSystemRoadmap/ExplainAgainButtonReSimplifyResponse.md|Explain Again button]] for user control.
    *   *Example*: `"Your answer must be in the same language as the question. Always end your answer with 'Would you like me to explain that again in simpler words?'"`

## Checks

*   **✔ Does the AI refuse to answer when the context is empty or irrelevant?**
    *   ✔ "Based on the provided context, the information is not available."
    *   ✘ "While I don't have that specific information, generally speaking..." (This is a hallucination).
*   **✔ Is the output format consistently followed, including citations and language?**
    *   ✔ "Photosynthesis is how plants make food from sunlight [Source: Page 42]. ¿Quieres que lo explique de nuevo?" (Answer includes citation and matches the question's Spanish language).
    *   ✘ "Plants use the sun for energy." (Missing citation and language consistency check).
*   **✔ Does the AI's tone and complexity match the defined persona (e.g., ALI5)?**
    *   ✔ "Think of a cell like a tiny, wobbly factory with lots of little workers inside!"
    *   ✘ "A cell is a membrane-bound structure containing cytoplasm and organelles, which..." (Too complex for the ALI5 persona).

## Failure modes

*   **Vague Instructions Leading to Hallucination**
    *   **Mistake**: Using a weak rule like "Try to use the context."
    *   **Why it happens**: The AI's base training encourages it to generate plausible-sounding text, so without a strict command, it will fill in gaps from its internal knowledge.
    *   **How to fix it**: Use absolute language like "STRICTLY" and "ONLY" as enforced by the [[RagSystemRoadmap/AnswerOnlyFromContext.md|Answer Only From Context]] rule.
*   **Overly Complex or Conflicting Rules**
    *   **Mistake**: Writing a prompt with ten different, nuanced formatting rules that might contradict each other.
    *   **Why it happens**: The designer tries to cover every edge case, but the AI cannot prioritize conflicting instructions effectively.
    *   **How to fix it**: Simplify the prompt. Prioritize the 2-3 most critical rules (e.g., cite sources, use simple language) and test thoroughly.
*   **Ignoring the User's Language Preference**
    *   **Mistake**: The AI always responds in English even when the question is in Arabic.
    *   **Why it happens**: The system prompt failed to include the [[RagSystemRoadmap/SameLanguageAsQuestion.md|Same Language As Question]] directive.
    *   **How to fix it**: Explicitly add a rule: "You must respond in the same language the user used to ask the question."

## Examples

*   **Real-World Analogy**: A system prompt is like a job description for a new employee. It tells them their role (e.g., "Customer Support Agent"), their rules ("Always be polite, never share internal data"), and their output format ("Summarize the ticket resolution in our CRM system"). Without it, the employee's performance would be inconsistent and unpredictable.
*   **Code/Config Snippet**: Below is a simplified version of a system prompt implementing key concepts like [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md|ALI5 Mode]] and [[RagSystemRoadmap/AnswerOnlyFromContext.md|Answer Only From Context]].
    ````
    SYSTEM_PROMPT = """
    You are ALI5, a friendly and patient tutor. Your goal is to explain concepts in the simplest terms possible, as if to a 5-year-old.

    RULES:
    1. You MUST answer the user's question using ONLY the information provided in the 'Context' section.
    2. If the answer is not in the context, you MUST say: "The information is not available."
    3. You MUST respond in the same language the user used.
    4. Use simple words, short sentences, and fun analogies.

    Context: {context}

    Question: {question}

    Answer:
    """
    ````

## Advanced notes

*   **Prompt Engineering is Iterative**: The initial prompt is a hypothesis. Use the [[RagSystemRoadmap/AnalyticsDashboard.md|Analytics Dashboard]] and [[RagSystemRoadmap/QueryLoggingFeedback.md|Query Logging Feedback]] to see where the AI fails, then refine the prompt in a cycle of [[RagSystemRoadmap/Evaluation.md|Evaluation]] and [[RagSystemRoadmap/Optimization.md|Optimization]].
*   **Consider Conditional Logic**: Advanced prompts can include "if-then" logic. For example, "IF the user asks for a definition, THEN provide one and [[RagSystemRoadmap/AddShortFriendlyExamples.md|Add Short Friendly Examples]]. IF the user says 'explain again', THEN rephrase the previous answer more simply."
*   **Leverage Metadata for Filtering**: The system prompt can instruct the AI to pay special attention to or prioritize chunks from a specific subject, leveraging the [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|Vector Metadata Source Page Subject]] stored during [[RagSystemRoadmap/Phase4VectorDatabaseLayer.md|Vector Database Layer]] ingestion.

## Prereqs
```dataviewjs
// Render clickable prereqs from frontmatter `prereqs`
const items = dv.current().prereqs ?? [];
const uniq = dv.array(items).distinct(i => i?.path ?? i);
if (uniq.length) {
  dv.list(uniq.map(i => `[[${i}]]`));
} else {
  dv.paragraph("None");
}
```

## See also
```dataviewjs
// Render clickable links from frontmatter `see_also`
const items = dv.current().see_also ?? [];
const uniq = dv.array(items).distinct(i => i?.path ?? i);
if (uniq.length) {
  dv.list(uniq.map(i => `[[${i}]]`));
} else {
  dv.paragraph("None");
}
```

