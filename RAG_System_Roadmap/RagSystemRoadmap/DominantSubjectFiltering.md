---
id: rag-system-roadmap-dominant-subject-filtering_b0f33050
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/PickChunksFromMainSubject.md
  - RagSystemRoadmap/BuildUnifiedContext.md
  - RagSystemRoadmap/Phase6GenerationLayer.md
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

# **Dominant Subject Filtering**

## Summary
*   **Simple**: A filter that ensures the AI's answer comes only from the main topic of your question, ignoring unrelated information.
*   **Technical**: A post-retrieval component that identifies the primary subject in a user query and filters the retrieved text chunks to select only those semantically aligned with that subject.
*   **Analogy**: Like asking a chef for a chocolate cake recipe and having them ignore the recipe for roast chicken that was also in the cookbook.
*   **Connection**: Works directly with the output of [[RagSystemRoadmap/PickChunksFromMainSubject.md]] to feed a [[RagSystemRoadmap/BuildUnifiedContext.md]] for the final [[RagSystemRoadmap/Phase6GenerationLayer.md]].

## When to use
*   **Use this** when your knowledge base contains multiple, distinct subjects (e.g., a database with both biology and history textbooks).
*   **Use this** when user queries are likely to be ambiguous or could pull information from multiple, conflicting topics.
*   **Do not use this** if your document collection is homogeneous (e.g., only physics papers), as the filter provides no benefit.
*   **Example**: A student asks "Explain photosynthesis" to a system containing science and art books; the filter ensures only science chunks are used, not passages about painting with light.

## Decision points
*   **How to identify the dominant subject?**
    *   **Option 1**: Analyze the user's query embedding against subject-labeled chunk embeddings.
    *   **Option 2**: Use a lightweight classifier on the query text.
    *   **Decision**: Choose based on the granularity of your subjects; embedding similarity is more flexible for nuanced subjects.
*   **How strict should the filter be?**
    *   **Option 1**: A hard filter that discards all chunks not from the dominant subject.
    *   **Option 2**: A soft filter that down-ranks but doesn't completely remove off-topic chunks.
    *   **Decision**: Use a hard filter when factual contradictions are critical to avoid (e.g., medical data); use a soft filter for more creative or exploratory tasks.
*   **Integration Point**: This filtering logically occurs after [[RagSystemRoadmap/SemanticSearch.md]] retrieves candidates but before the final [[RagSystemRoadmap/ContextConstruction.md]] for the generator.

## Examples
*   **Simple Example**:
    *   **Query**: "What was Newton's first law?"
    *   **Retrieved Chunks**: Some about physics (correct), some about the "Newton" tablet computer (incorrect).
    *   **After Filtering**: Only the physics chunks about motion and inertia are kept.
*   **Technical Example**:
    *   **Scenario**: A query for "Python" is ambiguous between the programming language and the snake.
    *   **Process**: The system computes the similarity between the query embedding and the centroid embeddings for "Programming" and "Biology" subjects.
    *   **Outcome**: The "Programming" subject has higher similarity, so all chunks from the "Biology" collection are filtered out before the answer is generated using [[RagSystemRoadmap/PromptComposition.md]].

## Key Takeaways
*   **Primary Benefit**: Drastically improves answer factuality and coherence by preventing contradictory or irrelevant information from polluting the context.
*   **Core Mechanism**: Relies on accurate subject labeling during the [[RagSystemRoadmap/Phase4VectorDatabaseLayer.md]] setup (e.g., using [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md]]).
*   **Performance Trade-off**: Adds a small computational step after retrieval but saves significant processing in the final, more expensive [[RagSystemRoadmap/GenerationFactualityFluency.md]] phase.
*   **Cross-system Insight**: The effectiveness of this filter is a direct result of good data organization in earlier phases, like [[RagSystemRoadmap/Phase2PreprocessingChunking.md]] and applying meaningful [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md]].

## Children
- [[RagSystemRoadmap/PickChunksFromMainSubject.md|Pick chunks from main subject]]
- [[RagSystemRoadmap/BuildUnifiedContext.md|Build unified context]]
- [[RagSystemRoadmap/Phase6GenerationLayer.md|Phase 6 — Generation Layer]]

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

