---
id: rag-system-roadmap-qdrant-setup-distance-cosine-vector-size-384_03b923a5
type: leaf
parent: RagSystemRoadmap/QdrantSetup.md
children:
prereqs:
  - RagSystemRoadmap/NormalizeEmbeddingsForCosineSimilarity.md
  - RagSystemRoadmap/ToolHuggingfaceIntfloatMultilingualE5Small.md
  - RagSystemRoadmap/ConvertTextChunksIntoDenseVectors384Dim.md
  - RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md
  - RagSystemRoadmap/BuildFastSemanticSearchDatabase.md
see_also:
  - RagSystemRoadmap/UpsertPointsIdVectorPayload.md
  - RagSystemRoadmap/VerifyCollectionsWithGetCollections.md
  - RagSystemRoadmap/QdrantSetup.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
summary: This configuration uses cosine similarity to measure the angle between 384-dimensional vectors, which is ideal for semantic search because it focuses on conceptual direction rather than magnitude, making it perfect for comparing text embeddings from models like [[EmbeddingHuggingfaceMultilingualE5Small]].
model: provider/model
run_id: manual
---

# Distance: COSINE | Vector size: 384

## Summary
This configuration uses cosine similarity to measure the angle between 384-dimensional vectors, which is ideal for semantic search because it focuses on conceptual direction rather than magnitude, making it perfect for comparing text embeddings from models like [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md]].

## Key concepts
- **Cosine Similarity**: A metric that measures the cosine of the angle between two vectors, focusing on their orientation rather than magnitude; for text, this means comparing the semantic meaning regardless of document length.
- **Vector Size 384**: The dimensionality of the embedding space where each text chunk is represented as a 384-number sequence; this specific size is common with efficient multilingual models like [[RagSystemRoadmap/ToolHuggingfaceIntfloatMultilingualE5Small.md]].
- **Normalization**: The process of scaling vectors to unit length before comparison; this is crucial for cosine similarity since it ensures the calculation focuses purely on direction.
  - Example: Like comparing two arrows pointing in the same direction—one might be longer (more text), but if they point the same way (same meaning), cosine similarity will be high.

## Why it matters
- **Semantic Accuracy**: Cosine distance excels at finding conceptually similar content even when word choice differs, which is essential for educational [[RagSystemRoadmap/SemanticSearch.md]] where students might ask questions using different terminology than the textbook.
- **Multilingual Support**: The 384-dimensional space from models like [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md]] effectively captures meaning across languages, enabling the system to handle [[RagSystemRoadmap/SameLanguageAsQuestion.md]] matching.
- **Performance Optimization**: Cosine similarity with normalized vectors is computationally efficient for [[RagSystemRoadmap/DatabaseQdrant.md]], allowing fast retrieval even with millions of vectors in [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md]].
  - Example: Just as you'd group similar-colored paints together regardless of can size, cosine similarity groups conceptually similar text regardless of length.

## Core steps
- **Normalize embeddings before storage**: Scale all vectors to unit length to ensure cosine similarity calculations work correctly, since cosine distance assumes normalized vectors.
  - Example: In code, after generating embeddings: `normalized_vector = vector / np.linalg.norm(vector)`
- **Configure Qdrant collection with cosine metric**: Set the distance parameter to Cosine when creating collections to ensure the database uses the correct similarity calculation.
  - Example: In Qdrant client configuration:
    ```python
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    
    client.create_collection(
        collection_name="text_embeddings",
        vectors_config=models.VectorParams(
            size=384,
            distance=models.Distance.COSINE
        )
    )
    ```
- **Verify normalization during upsert**: Ensure all vectors being inserted into [[RagSystemRoadmap/DatabaseQdrant.md]] are pre-normalized to maintain consistent similarity calculations.
  - Example: When using [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md]], include a normalization step in your pipeline before the upsert operation.

## Checks
- **Are vectors properly normalized before insertion?**
  - ✔ Calculate vector magnitude: it should equal 1.0 for all stored vectors
  - ✘ Vector magnitudes vary significantly (0.1, 2.5, 0.8) indicating missing normalization
- **Does cosine similarity return expected results for similar concepts?**
  - ✔ Query "canine" returns documents about "dogs" with high similarity scores
  - ✘ Query "canine" returns documents about "felines" or unrelated topics
- **Is the vector size consistent throughout the pipeline?**
  - ✔ All embeddings from [[RagSystemRoadmap/ConvertTextChunksIntoDenseVectors384Dim.md]] output 384 dimensions
  - ✘ Dimension mismatch errors when trying to store vectors in the collection

## Failure modes
- **Missing normalization leads to incorrect similarity**
  - **Why it happens**: Embedding models typically output non-normalized vectors, and developers forget this preprocessing step
  - **How to fix**: Implement [[RagSystemRoadmap/NormalizeEmbeddingsForCosineSimilarity.md]] as a mandatory step before [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md]]
- **Using wrong distance metric in collection configuration**
  - **Why it happens**: Qdrant defaults to Euclidean distance if not specified, which measures straight-line distance rather than angular similarity
  - **How to fix**: Explicitly set `distance=models.Distance.COSINE` when creating collections in [[RagSystemRoadmap/QdrantSetup.md]]
- **Dimensionality mismatch between model and database**
  - **Why it happens**: Using different embedding models or accidentally truncating/expanding vectors during processing
  - **How to fix**: Verify the output dimension of [[RagSystemRoadmap/EmbeddingGeneration.md]] matches the vector size (384) defined in collection configuration

## Examples
- **Real-world analogy**: Imagine two recipes—one detailed (long vector) and one concise (short vector)—both describing chocolate cake. Cosine similarity recognizes they're about the same dessert regardless of length, while Euclidean distance might prioritize two equally long but different recipes.
- **Code example for verification**:
  ```python
  # Verify collection configuration
  collections = client.get_collections()
  for collection in collections.collections:
      if collection.name == "text_embeddings":
          assert collection.vectors.distance == "Cosine"
          assert collection.vectors.size == 384
  
  # Test similarity calculation
  test_query = "educational system"
  results = client.search(
      collection_name="text_embeddings",
      query_vector=normalize(embed_query(test_query)),
      limit=3
  )
  # Results should show semantically similar content
  # even with different wording than the query
  ```

## Advanced notes
- **Cosine vs. Dot Product**: With normalized vectors, cosine similarity is equivalent to dot product, but normalization is what makes this relationship hold—this is why [[RagSystemRoadmap/NormalizeEmbeddingsForCosineSimilarity.md]] is critical.
- **Alternative distance metrics**: While cosine works well for semantic similarity, [[RagSystemRoadmap/HybridSearchBm25Embeddings.md]] might combine it with keyword-based approaches for improved [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]].
- **Performance considerations**: Cosine similarity calculations can be optimized through approximate nearest neighbor algorithms in [[RagSystemRoadmap/DatabaseQdrant.md]], significantly speeding up [[RagSystemRoadmap/QueryQdrantForTopKChunks.md]] operations.

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

