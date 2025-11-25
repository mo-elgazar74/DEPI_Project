---
id: rag-system-roadmap-database-qdrant_ce2e115a
type: leaf
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
prereqs:
  - RagSystemRoadmap/EmbeddingGeneration.md
  - RagSystemRoadmap/Output.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/RetrieverLlamaindexLangchain.md
see_also:
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/QdrantSetup.md
  - RagSystemRoadmap/Goal.md
summary: Qdrant is a vector search engine that stores document chunks as numerical vectors, enabling fast semantic similarity searches to find the most relevant information for a user's query within a RAG system.
model: provider/model
run_id: manual
---

# **Database:** Qdrant

## Summary
Qdrant is a vector search engine that stores document chunks as numerical vectors, enabling fast semantic similarity searches to find the most relevant information for a user's query within a RAG system.

## Key concepts
- **Vector**: A numerical representation of data, like a document's meaning, stored as a list of numbers. For example, the sentence "The cat sat on the mat" might be represented as `[0.1, -0.5, 0.8, ...]` by an [[RagSystemRoadmap/EmbeddingGeneration.md|embedding model]].
- **Collection**: A named set of vectors, similar to a database table, used to group related data like all documents for a specific subject and grade, created via [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md]].
- **Point**: A single vector entry in a collection, which includes the vector itself, a unique ID, and a payload (metadata) containing information like the [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|source text, page number, and subject]].
- **Distance Metric**: A mathematical formula, like [[RagSystemRoadmap/DistanceCosineVectorSize384.md|cosine similarity]], used to measure how similar two vectors are, determining the quality of search results.

## Why it matters
- It powers the core "search" in our RAG system, moving beyond simple keyword matching to understand the *meaning* behind queries.
- It enables the [[RagSystemRoadmap/BuildFastSemanticSearchDatabase.md|fast, scalable semantic search]] necessary for a responsive educational assistant, allowing students to ask questions in their own words.
- By efficiently storing and retrieving vectors, it forms the backbone of the [[RagSystemRoadmap/Phase4VectorDatabaseLayer.md|vector database layer]], connecting the [[RagSystemRoadmap/EmbeddingGeneration.md|embedding layer]] to the [[RagSystemRoadmap/RetrieverLlamaindexLangchain.md|retrieval layer]].

## Core steps
- **Create a collection** to organize vectors for a specific domain, such as "Grade5-Math," ensuring efficient and isolated searches. This is done using the Qdrant client's `create_collection` method, specifying the vector size and distance metric.
    ```python
    from qdrant_client import QdrantClient
    client.create_collection(
        collection_name="Grade5-Math",
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    ```
- **Upsert points** to add or update vectors and their metadata in the collection, making the document chunks searchable. This involves batching the vectors, IDs, and payloads from the previous processing phase.
    ```python
    client.upsert(
        collection_name="Grade5-Math",
        points=Batch(
            ids=[1, 2, 3],
            vectors=[[0.1, -0.2, ...], [0.4, 0.3, ...], ...],
            payloads=[{"text": "chunk1", "page": 1}, ...]
        )
    )
    ```
- **Query for top-K chunks** to find the most semantically relevant document pieces for a user's question, which are then passed to the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM for answer generation]]. This uses the `search` API call.
    ```python
    hits = client.search(
        collection_name="Grade5-Math",
        query_vector=user_query_vector,
        limit=5  # Top K
    )
    ```

## Checks
- ✔ After adding documents, can you search for a key term and get relevant results?
    - ✔ Example: Searching "photosynthesis" returns chunks about plant biology.
    - ✘ Example: Searching "photosynthesis" returns chunks about historical events.
- ✔ Is the vector dimensionality (e.g., 384) consistent between what's stored and what's used for queries?
    - ✔ Example: Both stored vectors and query vectors have 384 dimensions.
    - ✘ Example: A 512-dimension query is sent to a collection expecting 384-dimension vectors, causing an error.
- ✔ Does the payload contain all necessary metadata (e.g., [[RagSystemRoadmap/SaveChunkIdPageAndSource.md|source, page]]) for [[RagSystemRoadmap/DisplayCitationsSourcePage.md|displaying citations]]?
    - ✔ Example: The payload includes `{"source": "science_book.pdf", "page": 42}`.
    - ✘ Example: The payload is missing the source, making it impossible to cite.

## Failure modes
- **Mistake**: Creating a single, giant collection for all subjects and grades.
    - **Why it happens**: Simplicity; not considering that mixing unrelated topics (e.g., 1st-grade Arabic and 12th-grade Physics) can pollute search results.
    - **How to fix it**: Implement [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|collections per subject, grade, and term]] to keep searches focused and accurate.
- **Mistake**: Not normalizing vectors before calculating cosine similarity.
    - **Why it happens**: The embedding model outputs unnormalized vectors, and the importance of normalization for cosine similarity is overlooked.
    - **How to fix it**: Implement [[RagSystemRoadmap/NormalizeEmbeddingsForCosineSimilarity.md|vector normalization]] as a standard step after [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]] and before storage/search.
- **Mistake**: Using an inappropriate distance metric for your embedding model.
    - **Why it happens**: Defaulting to Euclidean distance without checking the embedding model's training objective, which can lead to poor semantic matching.
    - **How to fix it**: Use the metric the model was trained for; for models like [[RagSystemRoadmap/ToolHuggingfaceIntfloatMultilingualE5Small.md|multilingual E5]], this is typically [[RagSystemRoadmap/DistanceCosineVectorSize384.md|cosine similarity]].

## Examples
- **Real-world analogy**: Think of Qdrant as a highly specialized librarian for a vast library. Instead of just remembering book titles (keywords), this librarian understands the concepts inside every book (vectors). When you ask a question ("How do plants eat?"), the librarian quickly finds the paragraphs from various books that best explain the concept of photosynthesis, rather than just finding books with the word "eat" in the title.
- **Code snippet**: This shows a basic search operation, which is the primary interaction with Qdrant during the [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|retrieval phase]].
    ```python
    # This function is called when a user asks a question
    def retrieve_chunks(user_query):
        query_vector = embed_query(user_query) # Generate a vector for the query
        search_results = client.search(
            collection_name="Grade5-Science",
            query_vector=query_vector,
            limit=3 # Get top 3 most relevant chunks
        )
        return search_results
    ```

## Advanced notes
- For higher performance under load, consider using [[RagSystemRoadmap/AsyncSearchForSpeed.md|asynchronous search operations]] to handle multiple user queries concurrently without blocking.
- To improve search quality beyond pure semantic similarity, implement [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] which combines vector search with traditional keyword-based (BM25) matching.
- Integrate [[RagSystemRoadmap/QueryLoggingFeedback.md|query logging and feedback]] to collect data on which searches succeed or fail, which can be used for [[RagSystemRoadmap/FineTunedEmbeddingsForArabicDomain.md|fine-tuning embeddings]] or other [[RagSystemRoadmap/Optimization.md|optimizations]].

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

