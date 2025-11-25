---
id: rag-system-roadmap-prompt-composition_f1d1089d
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md
  - RagSystemRoadmap/Phase7EvaluationOptimization.md
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

# **Prompt Composition**

## Summary
*   **Core Idea:** Structuring the final input to the language model by combining distinct, purpose-built components to guide its behavior and ensure high-quality, grounded responses.
*   **Standard Pattern:** Uses a three-part structure: a `[System Prompt]` for role and rules, a `[User Question]`, and `[Retrieved Context]` for factual grounding.
*   **Primary Goal:** To maximize answer quality, factuality, and adherence to desired style by providing the model with explicit instructions and the necessary information in a clear format.

## When to use
*   **For Retrieval-Augmented Generation (RAG):** Essential whenever you are using a `[Retrieved Context]` from a `Vector Database` to answer a question, as it tells the model *how* to use that context.
*   **To Control Output Style:** When you need responses in a specific format or tone, like using `Ali5ModeExplainLikeToA5YearOld` or a `ChatStyleQAInterface`.
*   **To Enforce Response Rules:** When you must implement guardrails, such as `IfInfoMissingSayTheInformationIsNotAvailable` or `AnswerOnlyFromContext`.
*   **During `Evaluation & Optimization`:** To systematically test different prompt structures and measure their impact on metrics like `GenerationFactualityFluency`.

## Decision points
*   **System Prompt Specificity:**
    *   *Vague:* "You are a helpful assistant." → Leads to inconsistent style and potential hallucination.
    *   *Specific:* "You are an educational tutor. Use the provided context to answer. If the answer isn't in the context, say so. Explain like I'm 10." → Enforces style, grounding, and safety.
*   **Context Placement:**
    *   *Before the question:* Helps "prime" the model with facts before it sees the query.
    *   *After the question:* More natural conversational flow, but the model might sometimes ignore it.
*   **Instruction Emphasis:**
    *   *Use Delimiters:* Clearly mark the context (e.g., with `---CONTEXT---`) to prevent the model from confusing it with instructions.
    *   *Repeat Key Rules:* Crucial instructions (e.g., "DO NOT USE PRIOR KNOWLEDGE") can be placed in both the system prompt and alongside the context.
*   **Handling Missing Information:**
    *   *Strict:* Mandate `IfInfoMissingSayTheInformationIsNotAvailable`.
    *   *Flexible:* Allow the model to acknowledge gaps and provide a partial answer from available context.

## Examples
*   **Simple Analogy:** A cooking recipe.
    *   `[System Prompt]` = The chef's training and cooking philosophy (e.g., "always use fresh ingredients").
    *   `[User Question]` = The dish you want to make (e.g., "How do I make an omelette?").
    *   `[Retrieved Context]` = The specific recipe and ingredients from the cookbook.
    *   The final meal is the generated answer, combining all three elements.
*   **Technical Example (Educational RAG):**
    ```
    ### System Prompt:
    You are a friendly science tutor for 5th graders. Answer the question using ONLY the provided context. If the context doesn't contain the answer, say "I'm not sure, but let's look that up together!" Explain concepts simply, like you're talking to a 10-year-old.

    ### Context:
    {Retrieved Context from the `Vector Database` about photosynthesis}

    ### User Question:
    Why are leaves green?
    ```
    *This uses `SystemPromptUserQuestionRetrievedContext` composition with `Ali5ModeExplainLikeToA5YearOld` styling and a safe `IfInfoMissingSayTheInformationIsNotAvailable` fallback.*

## Key Takeaways
*   **Prompting is Engineering:** It's a deliberate design process, not just typing a question. The structure is a critical lever for performance.
*   **Explicit Beats Implicit:** Never assume the model knows how to use the context; you must explicitly command it via the `[System Prompt]`.
*   **Iterate and Evaluate:** The optimal prompt is found through testing in `Phase7EvaluationOptimization`, using `EvaluationLangfuseCustomScripts` to measure `GenerationFactualityFluency`.
*   **Connect to Retrieval Quality:** A perfect prompt cannot fix bad `Retrieved Context`; it works in tandem with a well-tuned `SemanticSearch` and `HybridSearchBm25Embeddings` pipeline.

## Children
- [[RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext|[System Prompt] + [User Question] + [Retrieved Context]]]
- [[RagSystemRoadmap/Phase7EvaluationOptimization.md|Phase 7 — Evaluation & Optimization]]

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

