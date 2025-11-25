---
id: rag-system-roadmap-backend-endpoints_8b9ebcc0
type: branch
parent: RagSystemRoadmap/Backend.md
children:
  - RagSystemRoadmap/AskHandleQuestionAnswering.md
  - RagSystemRoadmap/IndexAddNewDocuments.md
  - RagSystemRoadmap/EvalRunBenchmarks.md
prereqs:
see_also:
  - RagSystemRoadmap/FrameworkFastapi.md
  - RagSystemRoadmap/Backend.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
summary: 
model: provider/model
run_id: manual
---

# Endpoints:

## Summary
*   **Core communication channels** for the RAG system, defining how the frontend (UI) talks to the backend logic.
*   Three primary endpoints handle the system's main jobs: answering questions (`/ask`), adding new knowledge (`/index`), and testing performance (`/eval`).
*   Each endpoint triggers a specific, multi-step pipeline, connecting components like the [[RagSystemRoadmap/DatabaseQdrant.md|vector database]] and [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM generator]].

## When to use
*   **Use `/ask`** when a user submits a question; it's the primary, user-facing endpoint for the Q&A experience.
*   **Use `/index`** when new documents (PDFs, textbooks) need to be processed and made searchable by the system, expanding its knowledge base.
*   **Use `/eval`** during development or after major changes to run automated tests, measuring the system's accuracy and speed before deployment.
*   **Example**: A teacher uses the UI to ask "How does photosynthesis work?" -> triggers `/ask`. Later, they upload a new science module -> triggers `/index`. Before the school term starts, a developer runs a test suite -> triggers `/eval`.

## Decision points
*   **Choosing a framework**: [[RagSystemRoadmap/FrameworkFastapi.md]] is ideal for these endpoints due to its automatic API documentation, data validation, and native support for [[RagSystemRoadmap/AsyncSearchForSpeed.md|async operations]], which is crucial for performance.
*   **Synchronous vs. Asynchronous Design**: `/ask` is a prime candidate for [[RagSystemRoadmap/AsyncSearchForSpeed.md|async]] operations because it waits for multiple steps (embedding, [[RagSystemRoadmap/SemanticSearch.md|semantic search]], generation); `/index` can be slower and run in the background.
*   **Caching strategy**: Implement [[RagSystemRoadmap/CacheFrequentQueriesRedis.md|caching]] on `/ask` for identical or very similar user queries to reduce load and latency, but avoid caching on `/index` and `/eval`.
*   **Input validation**: `/ask` must validate the question text; `/index` must validate file types and sizes; `/eval` must validate the benchmark configuration to prevent errors.

## Examples
*   **Simple Analogy**: Think of endpoints like a restaurant's counter.
    *   `/ask` is where you order your food (ask a question) and get your meal (an answer).
    *   `/index` is the back door where new ingredients (documents) are delivered and prepped for the kitchen.
    *   `/eval` is the food critic who tastes everything to ensure quality.
*   **Technical Flow for `/ask`**:
    1.  User question arrives: "What is the Pythagorean theorem?"
    2.  Backend uses [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|embedding model]] to convert the question into a vector.
    3.  It performs a [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|query]] against the [[RagSystemRoadmap/DatabaseQdrant.md|vector database]] to find the most relevant text chunks.
    4.  The top chunks are combined into a [[RagSystemRoadmap/BuildUnifiedContext.md|unified context]].
    5.  This context and the question are sent to the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM]] with a specialized [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|educational system prompt]].
    6.  The generated answer, along with [[RagSystemRoadmap/DisplayCitationsSourcePage.md|citations]], is sent back to the user.

## Key Takeaways
*   **Separation of Concerns**: Each endpoint has a single, clear responsibility, making the system easier to maintain, debug, and scale.
*   **Performance is Critical**: Especially for `/ask`, as it's user-facing; techniques like [[RagSystemRoadmap/AsyncSearchForSpeed.md|async]], [[RagSystemRoadmap/CacheFrequentQueriesRedis.md|caching]], and a fast [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|embedding model]] are essential.
*   **Data Flow is Key**: Understanding how data moves from a user's question through retrieval and generation is the core of designing these endpoints effectively.
*   **Evaluation is Non-Negotiable**: The `/eval` endpoint, powered by tools like [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|evaluation scripts]], is what ensures the system provides accurate, high-quality answers over time.

## Children
- [[RagSystemRoadmap/AskHandleQuestionAnswering.md|`/ask` – handle question answering]]
- [[RagSystemRoadmap/IndexAddNewDocuments.md|`/index` – add new documents]]
- [[RagSystemRoadmap/EvalRunBenchmarks.md|`/eval` – run benchmarks]]

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

