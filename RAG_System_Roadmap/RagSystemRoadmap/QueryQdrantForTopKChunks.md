---
id: rag-system-roadmap-semantic-search-query-qdrant-for-top-k-chunks_80aa9587
type: leaf
parent: RagSystemRoadmap/SemanticSearch.md
children:
prereqs:
  - RagSystemRoadmap/EmbedUserQuery.md
  - RagSystemRoadmap/UpsertPointsIdVectorPayload.md
  - RagSystemRoadmap/DistanceCosineVectorSize384.md
  - RagSystemRoadmap/ConvertTextChunksIntoDenseVectors384Dim.md
  - RagSystemRoadmap/BuildFastSemanticSearchDatabase.md
see_also:
  - RagSystemRoadmap/SortByCosineSimilarity.md
  - RagSystemRoadmap/OptionallyRerankResults.md
  - RagSystemRoadmap/SemanticSearch.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
summary: This step takes a user's question, converts it into a vector embedding, and searches the [[Database Qdrant|Qdrant vector database]] to find the most semantically similar text chunks, returning the top-K results for use in generating an answer.
model: provider/model
run_id: manual
---

# Query Qdrant for top-K chunks

## Summary

This step takes a user's question, converts it into a vector embedding, and searches the Database Qdrant|Qdrant vector database to find the most semantically similar text chunks, returning the top-K results for use in generating an answer.

## Key concepts

*   **Vector Search**: A search method where both the query and the documents are represented as numerical vectors (lists of numbers) in a high-dimensional space, and similarity is calculated based on their geometric proximity. For example, using Distance Cosine Vector Size 384|cosine similarity to find vectors pointing in the most similar direction.
*   **Top-K Retrieval**: The process of asking the database for a specific number (K) of the most relevant results, rather than all possible matches. This is like a librarian being asked for the "5 best books" on a topic instead of every book that mentions it.
*   **Query Embedding**: The process of converting the user's natural language question into a vector using the same model that was used for the document chunks, ensuring they exist in the same mathematical space for a fair comparison. We use the Embedding Huggingface Multilingual E5 Small|multilingual E5-small model for this.
*   **Collection**: In Qdrant, a collection is a named set of vectors with the same dimensionality and distance function, analogous to a database table in traditional systems. Our system uses Create Collections Per Subject Grade Term|collections organized by subject, grade, and term.

## Why it matters

*   It is the core of the "Retrieval" in RAG, directly determining which information the AI model will use to formulate its answer, impacting both accuracy and relevance.
*   Efficient retrieval ensures the system responds quickly, providing a smooth user experience, especially when combined with techniques like Async Search For Speed|asynchronous search.
*   By correctly implementing filters and similarity search, it ensures the AI Answer Only From Context|answers only from the provided educational context, reducing hallucinations and improving factuality.

## Core steps

*   **Embed the user query** to transform the text question into a numerical vector that can be compared against stored document vectors, using the same Embedding Generation|embedding generation pipeline used for the documents.
    ```python
    # Example using the same model as document embedding
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('intfloat/multilingual-e5-small')
    query_vector = model.encode("What is photosynthesis?")
    ```
*   **Connect to the correct Qdrant collection** based on metadata like subject and grade, ensuring the search is scoped to the most relevant knowledge base, which is defined during Create Collections Per Subject Grade Term|collection setup.
    ```python
    # Using the Qdrant client
    from qdrant_client import QdrantClient
    client = QdrantClient(host="localhost", port=6333)
    collection_name = "science_grade6_term1"  # Dynamically set from UI dropdowns
    ```
*   **Execute a search query** using the query vector, specifying the top-K value and any metadata filters, to find the most semantically similar chunks based on Distance Cosine Vector Size 384|cosine similarity.
    ```python
    search_result = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=5,  # This is the 'K' in top-K
        query_filter=None  # Can filter by metadata like 'source_page'
    )
    ```
*   **Process and return the results** by extracting the text content and associated metadata (like source page and chunk ID) from the search hits, which will later be used to Build Unified Context|build the unified context for the AI generator and Display Citations Source Page|display citations.

## Checks

*   ✔ **Is the query vector the correct dimension (384)?** A mismatch will cause a search error.
    *   ✔ Correct: Vector shape is (384,).
    *   ✘ Incorrect: Vector shape is (768,) or an error occurs.
*   ✔ **Does the specified Qdrant collection exist?** Searching a non-existent collection fails.
    *   ✔ Correct: Collection "biology_grade10" is verified via `get_collections`.
    *   ✘ Incorrect: Collection "physic_grade12" (typo) returns a "not found" error.
*   ✔ **Are the returned chunks relevant to the query?** The top result should directly address the question.
    *   ✔ Correct: Query "define gravity" returns a chunk explaining Newton's law.
    *   ✘ Incorrect: Query "define gravity" returns a chunk about the water cycle.

## Failure modes

*   **Mismatched Embedding Models**: Using a different model to embed the query than was used for the documents places the vectors in different semantic spaces, making similarity scores meaningless.
    *   **Why it happens**: The embedding model was updated without re-embedding all documents, or a configuration error points to the wrong model.
    *   **How to fix it**: Strictly use the same Embedding Huggingface Multilingual E5 Small|embedding model identifier for both indexing and querying, and version-control your model choices.
*   **Over-filtering with Metadata**: Applying overly restrictive filters on metadata (like requiring an exact page number) can exclude all relevant chunks, returning zero results.
    *   **Why it happens**: The UI Dropdowns For Grade Term Subject|dropdowns for grade and subject might be set too narrowly, or the filter logic uses "must" instead of "should".
    *   **How to fix it**: Implement lenient filtering or fallback searches, and use Dominant Subject Filtering|dominant subject filtering logic that broadens the search if no results are found.
*   **Poor Chunking Leading to Bad Context**: If the original text was split poorly during Phase2 Preprocessing Chunking|chunking, even the most semantically similar chunk might be missing the answer or contain incomplete thoughts.
    *   **Why it happens**: Using a simple fixed-length splitter that cuts sentences in half, instead of more sophisticated methods like Recursive Chunking Split By Headers Smaller Units|recursive chunking.
    *   **How to fix it**: Revisit Chunking Methods|chunking methods and consider Adjust Chunk Size|adjusting the chunk size or using Semantic Chunking Split By Topic Similarity|semantic chunking to preserve logical blocks of text.

## Examples

*   **Real-World Analogy**: Imagine a librarian who has organized every paragraph from every book in the library on a giant map based on its topic. When you ask a question, the librarian translates your question into a location on this map and then quickly picks out the 3 paragraphs closest to that spot. This is what querying Qdrant for top-3 chunks does.
*   **Code Snippet**: The following shows a more complete function that performs the search, integrates with our Api Fastapi|FastAPI backend, and handles the result format for the next Phase6 Generation Layer|generation phase.
    ```python
    async def query_qdrant_topk(user_query: str, grade: str, subject: str, k: int = 5):
        # 1. Embed the query
        query_vector = embed_query(user_query)  # Uses shared embedding function
        
        # 2. Determine target collection
        collection_name = f"{subject}_{grade}"
        
        # 3. Perform the search
        client = get_qdrant_client()  # Gets a shared client
        hits = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=k
        )
        
        # 4. Format results for the generator
        top_chunks = []
        for hit in hits:
            top_chunks.append({
                "text": hit.payload["text"],
                "source": hit.payload["source"],
                "page": hit.payload.get("page", None),
                "score": hit.score  # The similarity score
            })
        return top_chunks
    ```

## Advanced notes

*   For large-scale deployments, consider implementing Hybrid Search Bm25 Embeddings|hybrid search which combines the semantic power of vector search with the keyword-matching precision of BM25, often yielding better overall recall.
*   The top-K chunks can be further refined using a Optionally Rerank Results|reranking model which uses a more computationally expensive cross-encoder to compare the query directly to each retrieved passage, providing a more accurate relevance score than the initial vector similarity.
*   To optimize performance, you can Cache Frequent Queries Redis|cache frequent queries in Redis, storing the query text and its resulting top-K chunks to avoid redundant vectorization and database searches.
*   Logging the queries and the retrieved chunk IDs is crucial for Evaluation Langfuse Custom Scripts|evaluation and continuous improvement, allowing you to track Retrieval Precision K Recall K|retrieval precision and recall over time.

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

