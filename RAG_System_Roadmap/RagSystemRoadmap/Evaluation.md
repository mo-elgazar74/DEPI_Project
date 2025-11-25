---
id: rag-system-roadmap-evaluation_a9c47a93
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/RetrievalPrecisionKRecallK.md
  - RagSystemRoadmap/GenerationFactualityFluency.md
  - RagSystemRoadmap/HumanReview.md
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

# **Evaluation**

## Summary
*   **What it is:** The systematic process of measuring how well your RAG system performs, ensuring it retrieves the right information and generates high-quality answers.
*   **Core components:** It primarily assesses two parts: the **Retrieval** (did it find the right documents?) and the **Generation** (did it write a good answer?).
*   **Human-in-the-loop:** Combines automated metrics with manual **Human review** for a complete picture, catching nuances that numbers alone miss.

## When to use
*   **During development:** To compare different components (e.g., testing `EmbeddingHuggingfaceMultilingualE5Small` vs. `FineTunedEmbeddingsForArabicDomain`) and guide your choices in the `TechStackSummary`.
*   **Before deployment (`Phase8Deployment`):** To establish a performance baseline and ensure the system meets quality standards.
*   **Continuously (`Phase9ContinuousImprovement`):** Use tools like an `AnalyticsDashboard` and `QueryLoggingFeedback` to monitor for performance drift or degradation over time.

## Decision points
*   **Automated vs. Human Evaluation:**
    *   Use automated metrics (`RetrievalPrecisionKRecallK`, `GenerationFactualityFluency`) for fast, scalable testing during development and on every code change.
    *   Use **Human review** for final validation, testing on edge cases, and evaluating subjective qualities like the educational value of an answer from `Ali5ModeExplainLikeToA5YearOld`.
*   **Choosing Retrieval Metrics:**
    *   Use `Precision@k` when user satisfaction depends on the top results being highly relevant (e.g., a search bar where users only look at the first few hits).
    *   Use `Recall@k` when it's critical to find *all* relevant information, even if it's buried deeper in the results (e.g., legal or medical research to avoid missing key evidence).
*   **Optimization Focus:**
    *   Poor `Precision@k`? Look at improving your `EmbeddingGeneration`, `HybridSearchBm25Embeddings`, or `OptionallyRerankResults`.
    *   Poor `Recall@k`? Investigate your `ChunkingMethods` (`FixedLength400600Tokens` vs. `SemanticChunkingSplitByTopicSimilarity`) or consider increasing the `TopKChunks` retrieved.
    *   Poor `Factuality`? The issue is likely in your `GenerationLayer`, specifically the `SystemPromptDesign` (e.g., reinforcing `AnswerOnlyFromContext`).

## Examples
*   **Simple Analogy:** Evaluating a RAG system is like grading a student's research paper. You check their bibliography (**Retrieval**) to see if they found good sources (`Precision@k`), and you grade the essay itself (**Generation**) for accuracy (`Factuality`) and clarity (`Fluency`). The teacher's notes are the **Human review**.
*   **Technical Example:** You run an `EvalRunBenchmarks` using `EvaluationLangfuseCustomScripts`.
    *   **Retrieval Test:** For the query "photosynthesis," your system retrieves 5 chunks (`k=5`). Three are directly about photosynthesis (`Precision@5 = 3/5 = 0.6`). However, there are 4 relevant chunks in the total database, so it found 3 of them (`Recall@5 = 3/4 = 0.75`).
    *   **Generation Test:** The system generates an answer. An automated metric checks if the answer's claims are supported by the retrieved context (`Factuality`). A separate model might score how natural the sentence structure is (`Fluency`). Finally, a domain expert reads it in the **Human review** to confirm it's both correct and easy for a 5th grader to understand.

## Key Takeaways
*   **Evaluation is not one-size-fits-all:** The right metrics depend on your application's goal. A fact-checking bot prioritizes `Factuality`, while a creative writing assistant cares more about `Fluency`.
*   **It connects the system:** Evaluation reveals how choices in early phases (like `ChunkingMethods` in `Phase2PreprocessingChunking`) directly impact final answer quality in the `GenerationLayer`.
*   **Start simple, then expand:** Begin with core automated metrics (`Precision@k`, `Factuality`) and a simple **Human review** checklist. Integrate more sophisticated tools like an `AnalyticsDashboard` as the system matures.

## Children
- [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|Retrieval: precision@k, recall@k]]
- [[RagSystemRoadmap/GenerationFactualityFluency.md|Generation: factuality, fluency]]
- [[RagSystemRoadmap/HumanReview.md|Human review]]

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

