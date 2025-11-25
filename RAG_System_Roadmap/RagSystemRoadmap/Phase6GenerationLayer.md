---
id: rag-system-roadmap-dominant-subject-filtering-phase-6-generation-layer_bcf88e43
type: leaf
parent: RagSystemRoadmap/DominantSubjectFiltering.md
children:
prereqs:
  - RagSystemRoadmap/PickChunksFromMainSubject.md
  - RagSystemRoadmap/BuildUnifiedContext.md
  - RagSystemRoadmap/QueryQdrantForTopKChunks.md
  - RagSystemRoadmap/EmbedUserQuery.md
  - RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md
see_also:
  - RagSystemRoadmap/DominantSubjectFiltering.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: This final phase transforms the retrieved, filtered context into a fluent, factual, and educational answer using a Large Language Model, guided by a specialized system prompt to ensure responses are accurate, simple, and tailored for students.
model: provider/model
run_id: manual
---

# Phase 6 — Generation Layer

## Summary
This final phase transforms the retrieved, filtered context into a fluent, factual, and educational answer using a Large Language Model, guided by a specialized system prompt to ensure responses are accurate, simple, and tailored for students.

## Key concepts
*   **System Prompt:** A set of instructions given to the LLM that defines its personality and rules; for our system, this means acting as a friendly tutor that explains concepts simply (like to a 5-year-old), sticks strictly to the provided context, and cites its sources.
    *   *Example: The system prompt is like a manager's brief to a new employee: "You are an educational assistant. Always use simple language. If the answer isn't in your source material, say so. Never make up information."*
*   **Context Construction:** The process of combining the top retrieved text chunks from the [[RagSystemRoadmap/Phase5RetrievalLayer.md|Retrieval Layer]] into a single, coherent block of text that the LLM will use as its knowledge base for generating the answer.
    *   *Example: `final_context = "\n\n".join([chunk.text for chunk in top_chunks])`*
*   **Factuality & Fluency:** The two main quality goals for the generated answer; factuality means the answer is grounded in and accurately reflects the retrieved context, while fluency means it is well-written, easy to understand, and flows naturally.
    *   *Example: A factual but non-fluent answer might be a disjointed list of facts, whereas a fluent but non-factual one might be a beautifully written paragraph that contains made-up details.*

## Why it matters
*   This is the user-facing component where all previous data processing and retrieval efforts culminate, directly determining the perceived quality and usefulness of the entire [[RagSystemRoadmap/RagSystemRoadmap.md|RAG System]].
*   A well-designed generation layer builds trust by providing accurate, cited answers and enhances the learning experience through clear, age-appropriate explanations via the [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md|Ali-5 Mode]].
*   It acts as a final guardrail against AI "hallucination" by explicitly instructing the model to only answer based on the provided context, implementing the [[RagSystemRoadmap/AnswerOnlyFromContext.md|Answer Only From Context]] principle.

## Core steps
*   **Build a unified context** from the top retrieved chunks to give the LLM a complete picture, ensuring the answer is informed by all relevant information and not just a single snippet.
    *   *Example: Use the [[RagSystemRoadmap/CombineTopKSnippetsIntoOneContext.md|Combine Top K Snippets]] component to merge chunks, often with a separator like `\n---\n` for clarity.*
*   **Compose the final prompt** by inserting the user's question and the unified context into a pre-defined template that includes the system instructions, creating the exact message sent to the LLM API.
    *   *Example: Using a [[RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md|System Prompt Template]]:*
        ````
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Question: {user_question}\nContext: {unified_context}"}
        ]
        ````
*   **Call the LLM API** (e.g., [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|Groq, OpenAI, or Mistral]]) with the composed prompt to generate the final answer, selecting a model that balances speed, cost, and quality for an educational setting.
    *   *Example: A basic API call using a library like `openai`:*
        ````
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.1 # Low temperature for more deterministic, factual outputs
        )
        answer = response.choices[0].message.content
        ````
*   **Post-process and deliver** the output by extracting the answer text, parsing any source citations, and formatting the final response for the [[RagSystemRoadmap/Frontend.md|Frontend]] to display to the user.
    *   *Example: The backend endpoint returns a JSON object like `{"answer": "The final generated text...", "sources": ["page_12", "page_15"]}` to the [[RagSystemRoadmap/UiReactTailwind.md|UI]].*

## Checks
*   ✔ **Does the answer directly use information from the provided context?**
    *   ✔ *Good: The answer cites specific facts, figures, or concepts that are verifiable in the context snippets.*
    *   ✘ *Bad: The answer introduces general knowledge or plausible-sounding information not present in the context.*
*   ✔ **Is the language simple, clear, and appropriate for the target grade level?**
    *   ✔ *Good: It uses short sentences and simple analogies, as defined in the [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|Educational System Prompt]].*
    *   ✘ *Bad: It uses complex jargon or academic language without explanation.*
*   ✔ **If the context is empty or irrelevant, does the system correctly state that it doesn't know?**
    *   ✔ *Good: It responds with a predefined message like, "The information is not available in my learning materials."*
    *   ✘ *Bad: It attempts to invent an answer or provides a generic, off-topic response.*

## Failure modes
*   **Hallucination and Confabulation:** The LLM generates plausible but incorrect information not found in the context.
    *   *Why it happens: The system prompt is too weak, the model's temperature is set too high, or the retrieved context is too sparse.*
    *   *How to fix it: Strengthen the [[RagSystemRoadmap/SystemPromptDesign.md|System Prompt]] with explicit instructions like [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md|"If info missing, say so"]], lower the model's temperature parameter, and improve upstream [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval precision]].*
*   **Ignoring the Context:** The model produces a generic answer that does not leverage the specific information provided in the unified context.
    *   *Why it happens: The context is poorly formatted, too long and buried, or the prompt does not sufficiently emphasize its importance.*
    *   *How to fix it: Improve [[RagSystemRoadmap/ContextConstruction.md|Context Construction]] to make key information stand out and rewrite the prompt to explicitly command the model to "base your answer ONLY on the following context."*
*   **Poor Educational Tone:** The answer is technically correct but delivered in a complex, unengaging manner unsuitable for students.
    *   *Why it happens: The default behavior of the base LLM is too formal, and the system prompt lacks specific tone instructions.*
    *   *How to fix it: Refine the [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|Custom Educational Prompt]] to mandate a friendly, simple tone and implement an [[RagSystemRoadmap/ExplainAgainButtonReSimplifyResponse.md|Explain Again Button]] for real-time simplification.*

## Examples
*   **Real-World Analogy:** Think of this phase as a skilled chef. The [[RagSystemRoadmap/Phase5RetrievalLayer.md|Retrieval Layer]] is the sous-chef who gathers the finest, most relevant ingredients (context chunks) from the pantry (vector database). The Generation Layer is the head chef who follows a secret recipe (the system prompt) to combine these ingredients into a delicious, beautifully plated meal (the final answer) for the customer (the student).
*   **Code Snippet:** A simplified version of the core generation function might look like this:
    ````python
    def generate_answer(question: str, context_chunks: list) -> str:
        # 1. Build Unified Context
        unified_context = "\n\n".join([chunk.text for chunk in context_chunks])
        
        # 2. Compose Prompt
        system_prompt = "You are a friendly tutor. Explain simply using only the context provided..."
        user_prompt = f"Question: {question}\nContext: {unified_context}"
        
        # 3. Call LLM
        response = llm_client.chat.completions.create(
            model="mistral-small",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )
        
        # 4. Return Answer
        return response.choices[0].message.content
    ````

## Advanced notes
*   For high-stakes or complex questions, consider adding a **re-ranking step** *before* generation, using the [[RagSystemRoadmap/OptionallyRerankResults.md|Optional Reranker]] to re-order the retrieved chunks by relevance to the query, ensuring the most critical information is at the top of the context window.
*   The [[RagSystemRoadmap/GenerationFactualityFluency.md|Generation Factuality & Fluency]] of outputs should be systematically measured during the [[RagSystemRoadmap/Phase7EvaluationOptimization.md|Evaluation & Optimization]] phase using tools like [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|Langfuse Custom Scripts]] to track performance over time.
*   To handle user feedback for continuous improvement, log prompts and generated answers via [[RagSystemRoadmap/QueryLoggingFeedback.md|Query Logging]] and use this data for [[RagSystemRoadmap/HumanReview.md|Human Review]] and potential [[RagSystemRoadmap/FineTunedEmbeddingsForArabicDomain.md|Fine-Tuning]] of the model or prompts.

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

