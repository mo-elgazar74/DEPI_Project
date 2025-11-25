---
id: rag-system-roadmap-system-prompt-design_e2e57044
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md
  - RagSystemRoadmap/AnswerOnlyFromContext.md
  - RagSystemRoadmap/SameLanguageAsQuestion.md
  - RagSystemRoadmap/AddShortFriendlyExamples.md
  - RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md
prereqs:
see_also:
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/Tips.md
summary: 
model: provider/model
run_id: manual
---

# **System Prompt Design**

## Summary
*   The initial, hidden instructions that define an AI's personality, rules, and output format within a [[RagSystemRoadmap/RagSystemRoadmap.md]].
*   Acts as a "constitution" for the AI, guiding it to produce consistent, high-quality, and safe responses.
*   Crucially controls how the AI uses the provided context, preventing it from inventing facts.

## When to use
*   **Always**: Every interaction with a language model is guided by a system prompt, even if it's a simple, default one.
*   **Critical for RAG**: Essential for instructing the model to [[RagSystemRoadmap/AnswerOnlyFromContext.md]] to prevent factual hallucinations.
*   **Building a persona**: When you need the AI to adopt a specific role, like an educational tutor using [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md]].
*   **Enforcing format**: To guarantee the output is in a specific structure, like JSON, or uses a specific language as in [[RagSystemRoadmap/SameLanguageAsQuestion.md]].

## Decision points
*   **Strictness vs. Creativity**: Choose between a rigid rule like [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md]] for factual accuracy or a more flexible prompt for creative tasks.
*   **Audience Expertise**: Decide if the prompt should enforce simple explanations ([[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md]]) or assume technical knowledge.
*   **Output Control**: Determine if you need to enforce language ([[RagSystemRoadmap/SameLanguageAsQuestion.md]]) or a specific, friendly tone with [[RagSystemRoadmap/AddShortFriendlyExamples.md]].
*   **Context Handling**: The most critical decision is whether to strictly enforce grounding in retrieved data ([[RagSystemRoadmap/AnswerOnlyFromContext.md]]) or allow the model to use its internal knowledge.

## Examples
*   **Simple Analogy**: A system prompt is like a manager's instructions to a new employee: "Only use the company handbook to answer customer questions, be polite, and if you don't know the answer, say 'I need to check with my manager.'"
*   **Technical Snippet**: A basic RAG system prompt:
    ````
    You are a helpful assistant. Answer the user's question based ONLY on the provided context.
    If the answer cannot be found in the context, say "The information is not available."
    Context: {retrieved_context}
    Question: {user_question}
    ````
*   **Advanced Prompt**: Incorporating multiple principles:
    ````
    You are a friendly science tutor for 5th graders. Answer the question using ONLY the context below.
    Use simple words and a fun analogy, like comparing a cell to a tiny factory.
    If the context doesn't have the answer, say "I don't have that information in my notes right now."
    Always respond in the same language as the question.
    Context: {retrieved_context}
    Question: {user_question}
    ````

## Key Takeaways
*   **Foundation of Behavior**: The system prompt is the primary lever for controlling AI behavior and safety in a production system.
*   **Prevents Hallucination**: Explicit instructions to [[RagSystemRoadmap/AnswerOnlyFromContext.md]] are non-negotiable for factual RAG applications.
*   **Clarity through Examples**: Using [[RagSystemRoadmap/AddShortFriendlyExamples.md]] inside the prompt is often more effective than abstract instructions.
*   **Iterative Process**: Designing an effective prompt requires continuous testing and refinement based on real user interactions and [[RagSystemRoadmap/Evaluation.md]].

## Children
- [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md|“Ali5 mode” – explain like to a 5-year-old]]
- [[RagSystemRoadmap/AnswerOnlyFromContext.md|Answer only from context]]
- [[RagSystemRoadmap/SameLanguageAsQuestion.md|Same language as question]]
- [[RagSystemRoadmap/AddShortFriendlyExamples.md|Add short, friendly examples]]
- [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md|If info missing → say “The information is not available.”]]

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

