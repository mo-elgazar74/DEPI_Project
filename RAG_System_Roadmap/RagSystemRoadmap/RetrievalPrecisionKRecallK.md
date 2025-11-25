---
id: rag-system-roadmap-evaluation-retrieval-precision-k-recall-k_d1f948fd
type: leaf
parent: RagSystemRoadmap/Evaluation.md
children:
prereqs:
  - RagSystemRoadmap/QueryQdrantForTopKChunks.md
  - RagSystemRoadmap/BuildFastSemanticSearchDatabase.md
  - RagSystemRoadmap/GenerationFactualityFluency.md
  - RagSystemRoadmap/HumanReview.md
see_also:
  - RagSystemRoadmap/Evaluation.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: Precision@k and recall@k are evaluation metrics that measure the quality of retrieved documents in a RAG system, where precision@k assesses the relevance of the top k results and recall@k measures how many of all relevant documents were found in those top k results.
model: provider/model
run_id: manual
---

# Retrieval: precision@k, recall@k

## Summary
Precision@k and recall@k are evaluation metrics that measure the quality of retrieved documents in a RAG system, where precision@k assesses the relevance of the top k results and recall@k measures how many of all relevant documents were found in those top k results.

## Key concepts
- **Precision@k**: The fraction of relevant documents among the top k retrieved results; it answers "Of the k documents I retrieved, how many are actually useful?"
- **Recall@k**: The fraction of all possible relevant documents that were successfully retrieved in the top k results; it answers "Of all the relevant documents that exist, how many did I manage to find in my top k results?"
- **Relevance judgment**: The ground truth determination of whether a document actually answers the user's query, which is typically done by human evaluators or against a labeled test set
- **Top-k retrieval**: The practice of returning only the k most similar documents from the vector database based on similarity scores like [[RagSystemRoadmap/DistanceCosineVectorSize384.md|cosine similarity]]

## Why it matters
- **System optimization**: These metrics directly inform whether you need to adjust your [[RagSystemRoadmap/ChunkingMethods.md|chunking strategy]], improve [[RagSystemRoadmap/EmbeddingGeneration.md|embeddings]], or modify your [[RagSystemRoadmap/SemanticSearch.md|search approach]]
- **User experience**: High precision@k means users see relevant answers faster, while high recall@k ensures comprehensive coverage of available information
- **Performance benchmarking**: Provides quantitative measures to track improvements across [[RagSystemRoadmap/Phase7EvaluationOptimization.md|evaluation and optimization]] cycles
- **Resource allocation**: Helps determine the optimal k value for balancing computational cost (higher k) with result quality

## Core steps
- **Define relevance criteria** before evaluation to ensure consistent scoring across different queries and evaluators, since subjective judgments can vary significantly
  ```python
  # Example relevance scoring criteria
  relevance_criteria = {
      2: "Directly answers the query with specific facts",
      1: "Partially relevant or provides background context", 
      0: "Irrelevant or unrelated to the query"
  }
  ```
- **Calculate precision@k** by dividing the count of relevant documents in top k by k, focusing on the quality of what you actually present to users
  ```python
  def precision_at_k(retrieved_docs, relevant_docs, k):
      top_k = retrieved_docs[:k]
      relevant_in_top_k = [doc for doc in top_k if doc in relevant_docs]
      return len(relevant_in_top_k) / k
  ```
- **Calculate recall@k** by dividing the count of relevant documents in top k by the total relevant documents available, measuring coverage of available knowledge
  ```python
  def recall_at_k(retrieved_docs, relevant_docs, k):
      top_k = retrieved_docs[:k]
      relevant_in_top_k = [doc for doc in top_k if doc in relevant_docs]
      return len(relevant_in_top_k) / len(relevant_docs)
  ```
- **Set appropriate k value** based on your [[RagSystemRoadmap/ContextConstruction.md|context window limitations]] and user needs, typically aligning with how many chunks you combine in [[RagSystemRoadmap/CombineTopKSnippetsIntoOneContext.md|context construction]]

## Checks
- **Are you using consistent relevance judgments across evaluations?**
  - ✔: Using predefined criteria with multiple annotators showing high agreement
  - ✘: Different team members using subjective, undocumented standards
- **Does your k value match your practical retrieval needs?**
  - ✔: k=5 when your [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM]] context window fits ~5 chunks
  - ✘: k=10 when you only use top 3 chunks in actual generation
- **Are you testing with representative query types?**
  - ✔: Mix of factual, conceptual, and multi-hop questions from real usage
  - ✘: Only simple keyword-matching test queries

## Failure modes
- **Over-optimizing for one metric** while ignoring the other, which happens when teams focus only on precision (user satisfaction) while missing comprehensive coverage
  - **Fix**: Monitor both metrics and find the optimal balance for your use case
- **Using unrealistic k values** that don't match deployment constraints, occurring when evaluation uses k=10 but production only retrieves k=3 due to latency requirements
  - **Fix**: Set k based on actual [[RagSystemRoadmap/Phase8Deployment.md|deployment]] parameters and [[RagSystemRoadmap/ContextConstruction.md|context construction]] limits
- **Poor relevance ground truth** due to inconsistent labeling, happening when multiple evaluators have different interpretations of "relevant"
  - **Fix**: Create detailed labeling guidelines and measure inter-annotator agreement

## Examples
- **Library search analogy**: Imagine searching for "books about Python programming" in a library with 20 relevant books total
  - Precision@5 = 4/5 = 80% (4 of your 5 results are actually about Python)
  - Recall@5 = 4/20 = 20% (you found only 4 of the 20 available Python books)
- **Code implementation** for evaluating your [[RagSystemRoadmap/RetrieverLlamaindexLangchain.md|retriever]] against a test set:
  ```python
  # Evaluate on multiple queries
  test_queries = {
      "query1": {"retrieved": ["docA", "docB", "docC", "docD", "docE"],
                 "relevant": ["docA", "docB", "docX", "docY"]},
      "query2": {"retrieved": ["docF", "docG", "docH", "docI", "docJ"], 
                 "relevant": ["docF", "docH", "docZ"]}
  }
  
  for query, data in test_queries.items():
      p_at_3 = precision_at_k(data["retrieved"], data["relevant"], k=3)
      r_at_3 = recall_at_k(data["retrieved"], data["relevant"], k=3)
      print(f"{query}: P@3={p_at_3:.2f}, R@3={r_at_3:.2f}")
  ```

## Advanced notes
- **The precision-recall tradeoff**: Increasing k typically improves recall (finding more relevant documents) but may decrease precision (including more irrelevant ones), requiring careful balancing
- **k selection strategy**: Choose k based on your [[RagSystemRoadmap/CombineTopKSnippetsIntoOneContext.md|context construction]] capacity and whether your priority is accuracy (lower k) or comprehensiveness (higher k)
- **Relationship to other metrics**: These retrieval metrics feed into overall [[RagSystemRoadmap/GenerationFactualityFluency.md|generation quality]] but don't guarantee good final answers if the [[RagSystemRoadmap/SystemPromptDesign.md|system prompt]] is poorly designed
- **Integration with [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|evaluation frameworks]]**: Automate tracking these metrics across [[RagSystemRoadmap/EvalRunBenchmarks.md|benchmark runs]] to monitor [[RagSystemRoadmap/Phase9ContinuousImprovement.md|continuous improvement]]

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

