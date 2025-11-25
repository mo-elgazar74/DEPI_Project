---
id: rag-system-roadmap-backend-endpoints-eval-run-benchmarks_d1ab0277
type: leaf
parent: RagSystemRoadmap/Endpoints.md
children:
prereqs:
  - RagSystemRoadmap/AskHandleQuestionAnswering.md
  - RagSystemRoadmap/IndexAddNewDocuments.md
  - RagSystemRoadmap/Evaluation.md
  - RagSystemRoadmap/Endpoints.md
  - RagSystemRoadmap/Backend.md
see_also:
summary: This endpoint executes a comprehensive benchmark suite to evaluate the performance, accuracy, and quality of the RAG system's retrieval and generation components against a curated set of test questions and expected answers.
model: provider/model
run_id: manual
---

# `/eval` – run benchmarks

## Summary
This endpoint executes a comprehensive benchmark suite to evaluate the performance, accuracy, and quality of the RAG system's retrieval and generation components against a curated set of test questions and expected answers.

## Key concepts
*   **Benchmarking** is the process of systematically testing a system against a standard to measure its performance; here, it involves running a predefined set of questions through the entire pipeline to score its outputs.
    *   *Example:* Like a teacher using a standardized test to compare student performance across different schools, this endpoint uses a fixed set of Q&A pairs to objectively measure the AI's accuracy over time.
*   **Evaluation Metrics** are quantitative scores that measure specific aspects of system performance, such as [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|precision@K]] for retrieval quality and [[RagSystemRoadmap/GenerationFactualityFluency.md|factuality/fluency]] for answer quality.
    *   *Example:* `precision@3 = (Number of relevant chunks in top 3 results) / 3`
*   **Ground Truth** refers to the curated dataset of questions and their known-correct answers, which serves as the benchmark for comparing the system's live outputs.
    *   *Example:* A JSON file containing `{"question": "What is photosynthesis?", "ideal_answer": "The process plants use to convert sunlight into energy...", "source_documents": ["biology_textbook_page_42"]}`

## Why it matters
*   It provides objective, data-driven evidence of system improvements or regressions after code changes, model updates, or new data ingestion, moving beyond subjective "it feels faster/better" assessments.
*   It systematically identifies weak points in the pipeline—whether in [[RagSystemRoadmap/SemanticSearch.md|retrieval]], [[RagSystemRoadmap/ContextConstruction.md|context building]], or [[RagSystemRoadmap/GenerationFactualityFluency.md|generation]]—guiding focused [[RagSystemRoadmap/Optimization.md|optimization]] efforts.
*   It creates a feedback loop for ContinuousImprovement|continuous improvement, establishing a performance baseline that all future developments must meet or exceed to maintain quality.

## Core steps
*   **Load the benchmark dataset** to have a consistent standard for comparison, ensuring every evaluation run tests the system against the same questions and expected answers.
    *   *Example:* `test_questions = load_json("benchmark_questions_v1.json")`
*   **Execute the full RAG pipeline** for each benchmark question, from [[RagSystemRoadmap/EmbedUserQuery.md|embedding]] and [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|searching]] to [[RagSystemRoadmap/BuildUnifiedContext.md|context construction]] and [[RagSystemRoadmap/AskHandleQuestionAnswering.md|answer generation]], to simulate real-world usage.
    *   *Example:* `for q in test_questions: response = rag_chain.invoke({"question": q})`
*   **Score retrieval performance** by comparing the system's retrieved chunks against the ground truth source documents for each question, calculating metrics like [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|precision@K]] and recall@K.
    *   *Example:* `precision@5 = len(set(retrieved_docs) & set(ground_truth_docs)) / 5`
*   **Score generation quality** by comparing the system's generated answers against the ideal answers using automated metrics and, optionally, [[RagSystemRoadmap/HumanReview.md|human evaluation]] for nuanced aspects like factuality and clarity.
    *   *Example:* `factuality_score = answer_relevancy_score(system_answer, ideal_answer)`
*   **Log results to [[RagSystemRoadmap/AnalyticsDashboard.md|analytics]]** and [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|tracking systems]] to create a historical record of performance, enabling trend analysis and correlation of changes with metrics.
    *   *Example:* `langfuse.score_trace(trace_id, "retrieval_precision", precision_score)`

## Checks
*   ✔ Are retrieval scores ([[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|precision@K]]) consistently above our target threshold (e.g., 80%) across all benchmark questions?
    ✘ Scores fluctuate wildly between 30% and 90%, indicating unstable retrieval.
*   ✔ Does the [[RagSystemRoadmap/GenerationFactualityFluency.md|generation quality]] remain stable or improve when we update the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM provider]] or [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|system prompt]]?
    ✘ Factuality scores drop by 15% after a prompt change, signaling a regression.
*   ✔ Is the endpoint execution time acceptable for our [[RagSystemRoadmap/AnalyticsDashboard.md|monitoring]] needs (e.g., completes within 10 minutes for 100 questions)?
    ✘ Benchmark takes 2 hours to run, making it impractical for pre-deployment checks.

## Failure modes
*   **Stale benchmark dataset**: The ground truth questions and answers become outdated as the knowledge base evolves, causing the system to be penalized for providing newer, correct information.
    *   *Why it happens:* The benchmark file isn't regularly reviewed and updated alongside the document corpus.
    *   *How to fix it:* Implement a scheduled review process for the benchmark dataset and version it alongside major knowledge base updates.
*   **Overfitting to the benchmark**: The system is specifically tuned to perform well on the test questions but fails on slightly different real-user queries, reducing general usefulness.
    *   *Why it happens:* Making too many iterative changes based solely on benchmark scores without validating on real user [[RagSystemRoadmap/QueryLoggingFeedback.md|query logs]].
    *   *How to fix it:* Use A/B testing with live traffic and maintain a separate validation set of questions that never influences development decisions.
*   **Metric misinterpretation**: Focusing exclusively on one metric (e.g., retrieval precision) while ignoring others (e.g., answer fluency) leads to lopsided optimizations that degrade overall user experience.
    *   *Why it happens:* Lack of a unified scoring system that balances multiple quality dimensions.
    *   *How to fix it:* Create a weighted overall score that combines [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval]] and [[RagSystemRoadmap/GenerationFactualityFluency.md|generation metrics]] and set minimum thresholds for each.

## Examples
*   **Real-world analogy**: Think of a car manufacturer's quality control line. Each car coming off the assembly line undergoes the same standardized tests (braking distance, emissions, noise levels). The `/eval` endpoint is this quality control line for your RAG system—every component update or new document batch gets tested against the same rigorous standards before being deemed "roadworthy."
*   **Code snippet**: A simplified version of the evaluation logic might look like this:
    ````python
    def run_benchmarks():
        benchmark_data = load_benchmark_dataset()
        results = []
        
        for item in benchmark_data:
            # Run the full pipeline
            retrieved_chunks = retrieve_chunks(item["question"])
            generated_answer = generate_answer(item["question"], retrieved_chunks)
            
            # Calculate scores
            retrieval_score = calculate_retrieval_precision(
                retrieved_chunks, item["source_documents"]
            )
            generation_score = calculate_answer_similarity(
                generated_answer, item["ideal_answer"]
            )
            
            results.append({
                "question": item["question"],
                "retrieval_score": retrieval_score,
                "generation_score": generation_score
            })
        
        log_to_analytics(results)
        return aggregate_scores(results)
    ````

## Advanced notes
*   For more sophisticated evaluation, implement [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|custom evaluation scripts]] that go beyond simple string matching, using LLM-as-a-judge to evaluate answer quality based on semantic equivalence rather than exact text overlap.
*   Consider implementing [[RagSystemRoadmap/AsyncSearchForSpeed.md|asynchronous processing]] for the benchmark execution when dealing with large test suites, significantly reducing total evaluation time by processing multiple questions concurrently rather than sequentially.
*   Extend the benchmark to test edge cases and FailureModes|failure modes explicitly, such as questions with no available answer in the knowledge base (testing the [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md|"information not available" response]]) or questions containing [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md|mathematical symbols]] that need special handling.

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

