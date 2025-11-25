---
id: rag-system-roadmap-qdrant-setup_dc2278f5
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md
  - RagSystemRoadmap/DistanceCosineVectorSize384.md
  - RagSystemRoadmap/UpsertPointsIdVectorPayload.md
  - RagSystemRoadmap/VerifyCollectionsWithGetCollections.md
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

# **Qdrant Setup**

## Summary
*   **Core Purpose**: Establishes the vector database layer for your RAG system, enabling fast and accurate semantic search over your educational content.
*   **Primary Function**: Stores document chunks as numerical vectors, allowing the system to find conceptually similar content to a user's query.
*   **Key Configuration**: Involves creating organized collections (e.g., `Create collections per subject/grade/term`) and defining how similarity is measured (e.g., `Distance: COSINE | Vector size: 384`).
*   **Data Flow**: After `EmbeddingGeneration`, processed chunks are `Upsert points (id + vector + payload)` into Qdrant, which are later retrieved by the `QueryQdrantForTopKChunks` process.

## When to use
*   **Building a Semantic Search System**: When you need to retrieve information based on conceptual meaning rather than just keyword matching.
*   **Organizing Large Volumes of Educational Data**: When your content is diverse and needs logical separation, like creating distinct collections for different subjects or grade levels.
*   **After Text is Embedded**: This step directly follows the `ConvertTextChunksIntoDenseVectors384Dim` process in the `Phase3EmbeddingLayer`.
*   **Before the Generation Phase**: Qdrant is queried during the `Phase5RetrievalLayer` to provide relevant context to the `Phase6GenerationLayer`.

## Decision points
*   **Collection Strategy**: Choose between a single large collection versus `Create collections per subject/grade/term`.
    *   *Single Collection*: Simpler to manage but may mix unrelated contexts (e.g., 1st-grade math with 12th-grade physics).
    *   *Multiple Collections*: Enables precise, domain-specific search and filtering, improving retrieval accuracy for targeted educational contexts.
*   **Similarity Metric**: Selecting `Distance: COSINE | Vector size: 384` versus alternatives like Euclidean (L2) or Dot Product.
    *   *Cosine*: Ideal for text similarity; focuses on the angle between vectors, ignoring magnitude, which works well with normalized embeddings from models like `EmbeddingHuggingfaceMultilingualE5Small`.
    *   *Euclidean*: Measures straight-line distance; better for comparing physical magnitudes rather than semantic orientation.
*   **Payload Design**: Deciding what metadata to include in the payload during `Upsert points (id + vector + payload)`.
    *   *Minimal*: Just source and page number (`VectorMetadataSourcePageSubject`).
    *   *Rich*: Include subject, grade, term, and other filters to enable powerful `DominantSubjectFiltering` and `DisplayCitationsSourcePage`.

## Examples
*   **Analogy**: Setting up Qdrant is like organizing a library.
    *   Creating collections is like having separate sections for Science, History, and Math.
    *   `Distance: COSINE | Vector size: 384` is the rule that says, "Find books on a similar topic, not just books of the same thickness."
    *   `Upsert points (id + vector + payload)` is the process of adding a new book to the catalog, recording its unique ID (call number), a summary of its content (the vector), and its location/subject (the payload).
*   **Technical Snippet**: A simplified Python example using the Qdrant client.
    ```python
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams

    # Connect to Qdrant
    client = QdrantClient("localhost", port=6333)

    # Create a collection for "Grade10_Mathematics_Term1"
    client.create_collection(
        collection_name="Grade10_Mathematics_Term1",
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

    # Verify the collection was created
    collections = client.get_collections()
    print([collection.name for collection in collections.collections])
    ```

## Key Takeaways
*   **Organization is Critical**: Properly structured collections (`Create collections per subject/grade/term`) are the foundation for accurate, context-aware retrieval in an educational RAG system.
*   **Configuration Matters**: The choice of `Distance: COSINE | Vector size: 384` is not arbitrary; it's optimized for the semantic nature of text embeddings and should match your embedding model's output.
*   **Metadata is Power**: The payload stored during `Upsert points (id + vector + payload)` is essential for post-retrieval filtering, citation display, and building a transparent `ChatStyleQAInterface`.
*   **Always Verify**: Using `Verify collections with get_collections()` is a simple but crucial step to avoid errors downstream in the `Phase5RetrievalLayer`.

## Children
- [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|Create collections per subject/grade/term]]
- [[RagSystemRoadmap/DistanceCosineVectorSize384.md|Distance: COSINE | Vector size: 384]]
- [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md|Upsert points (id + vector + payload)]]
- [[RagSystemRoadmap/VerifyCollectionsWithGetCollections.md|Verify collections with `get_collections()`]]

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

