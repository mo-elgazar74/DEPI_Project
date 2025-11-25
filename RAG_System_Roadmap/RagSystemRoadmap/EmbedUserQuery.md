---
id: rag-system-roadmap-semantic-search-embed-user-query_e7db08f6
type: leaf
parent: RagSystemRoadmap/SemanticSearch.md
children:
prereqs:
  - RagSystemRoadmap/ToolHuggingfaceIntfloatMultilingualE5Small.md
  - RagSystemRoadmap/ConvertTextChunksIntoDenseVectors384Dim.md
  - RagSystemRoadmap/NormalizeEmbeddingsForCosineSimilarity.md
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/VectorMetadataSourcePageSubject.md
see_also:
  - RagSystemRoadmap/QueryQdrantForTopKChunks.md
  - RagSystemRoadmap/SortByCosineSimilarity.md
  - RagSystemRoadmap/OptionallyRerankResults.md
  - RagSystemRoadmap/SemanticSearch.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
summary: This step converts a user's natural language question into a numerical vector representation using the same embedding model that processed the document chunks, enabling semantic similarity comparison within the vector database.
model: provider/model
run_id: manual
---

# Embed user query

## Summary

This step converts a user's natural language question into a numerical vector representation using the same embedding model that processed the document chunks, enabling semantic similarity comparison within the vector database.

## Key concepts

*   **Embedding Model**: A pre-trained neural network that converts text into fixed-length numerical vectors (embeddings); we use [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|HuggingFace multilingual-e5-small]] which outputs 384-dimensional vectors and understands multiple languages including Arabic.
    *   *Example*: Think of it as a specialized translator that doesn't convert language but converts the *meaning* of text into a unique numerical "fingerprint" that a computer can compare.
*   **Query Vector**: The specific numerical output (a list of 384 numbers) generated from the user's question, which serves as the search key in the [[RagSystemRoadmap/SemanticSearch.md]] system.
    *   *Example*: For the query "How does photosynthesis work?", the model produces a vector like `[0.12, -0.45, 0.88, ...]` (with 381 more numbers), capturing the semantic essence of the question.
*   **Cosine Similarity**: The mathematical metric used to measure the angle between the query vector and document chunk vectors in the [[RagSystemRoadmap/DatabaseQdrant.md]]; a smaller angle (cosine similarity closer to 1) indicates higher semantic relevance.
    *   *Example*: Just as two arrows pointing in the same direction have a cosine similarity of 1, the vectors for "canine" and "dog" will be very close, while "canine" and "astronomy" will point in different directions.

## Why it matters

*   It bridges the gap between human language and machine-readable data, allowing the [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]] to find conceptually relevant information rather than just keyword matches.
    *   *Example*: A keyword search for "bank" might return documents about riverbanks or financial banks, but a semantic search using an embedded query for "where to get a loan" will correctly find the financial institution content.
*   Enables the core retrieval mechanism of [[RagSystemRoadmap/Phase5RetrievalLayer.md|Phase 5: Retrieval Layer]], where the embedded query is used to [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|find the most relevant chunks]] based on [[RagSystemRoadmap/DistanceCosineVectorSize384.md|cosine similarity]].
*   Using the *same* model for both document chunks and user queries ensures a consistent vector space, making similarity comparisons meaningful and accurate.
    *   *Example*: It's like using the same ruler to measure both the blueprint and the finished product; using different rulers (models) would give unreliable comparisons.

## Core steps

*   **Normalize the query text** by applying the same [[RagSystemRoadmap/TextCleaning.md|cleaning rules]] used for document chunks (lowercasing, removing extra spaces, [[RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md|normalizing digits]]) to ensure the input to the embedding model is consistent.
    *   *Reason*: Preprocessing inconsistencies can lead to different vector representations for semantically identical text.
    *   *Example*: The query "What's the 1st law of motion?" should be cleaned to "what's the first law of motion?" just like the document text was.
        ```python
        # Example cleaning before embedding
        original_query = "What's the 1st law of motion?"
        cleaned_query = clean_text(original_query)  # Output: "what's the first law of motion?"
        ```
*   **Generate the embedding vector** by passing the cleaned query through the [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]] pipeline using the [[RagSystemRoadmap/ToolHuggingfaceIntfloatMultilingualE5Small.md|multilingual E5-small model]], which outputs a 384-dimensional float vector.
    *   *Reason*: This creates the numerical representation needed for similarity search in the vector space.
    *   *Example*:
        ```python
        from sentence_transformers import SentenceTransformer
        
        model = SentenceTransformer('intfloat/multilingual-e5-small')
        query_embedding = model.encode("what's the first law of motion?")
        print(len(query_embedding))  # Output: 384
        print(type(query_embedding)) # Output: <class 'numpy.ndarray'>
        ```
*   **Normalize the embedding vector** using [[RagSystemRoadmap/NormalizeEmbeddingsForCosineSimilarity.md|L2 normalization]] so all vectors have unit length, which makes cosine similarity calculation equivalent to dot product for faster computation.
    *   *Reason*: Cosine similarity is calculated as the dot product of normalized vectors, and pre-normalizing speeds up the [[RagSystemRoadmap/DatabaseQdrant.md|vector database]] search.
    *   *Example*:
        ```python
        import numpy as np
        
        # Normalize the embedding for cosine similarity
        normalized_embedding = query_embedding / np.linalg.norm(query_embedding)
        print(np.linalg.norm(normalized_embedding))  # Output: ~1.0 (unit length)
        ```

## Checks

*   **Is the query embedding the correct shape and type?**
    *   ✔ 384-dimensional numpy array of float32 values
    *   ✘ Wrong dimension (not 384), wrong data type (strings or integers), or empty array
*   **Does the same query produce the same embedding?**
    *   ✔ Identical vectors for "photosynthesis" and "photosynthesis" (deterministic output)
    *   ✘ Different vectors for the same input text, indicating model instability or preprocessing issues
*   **Are semantically similar queries producing similar vectors?**
    *   ✔ "Canine behavior" and "dog habits" have high cosine similarity (>0.7)
    *   ✘ "Canine behavior" and "astronomy facts" have low similarity (<0.3) despite both being noun phrases
*   **Is the query language handled correctly for multilingual support?**
    *   ✔ Arabic query "ما هي عملية البناء الضوئي؟" generates a valid embedding and finds relevant Arabic content
    *   ✘ Mixed-language queries produce poor results or errors in embedding generation

## Failure modes

*   **Vocabulary mismatch** occurs when the user's query uses different terminology than the document chunks, causing low similarity scores even for relevant content.
    *   *Why it happens*: The embedding model may not recognize that "cardiovascular system" and "heart and blood vessels" are synonymous if this relationship wasn't well-learned during training.
    *   *How to fix it*: Implement [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] that combines semantic search with traditional keyword matching (BM25) to catch terminology variations.
*   **Language domain mismatch** happens when the general-purpose embedding model struggles with specialized educational terminology or Arabic domain-specific phrases.
    *   *Why it happens*: The pre-trained [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|multilingual E5 model]] was trained on web data and may not optimally represent educational concepts from the curriculum.
    *   *How to fix it*: Consider [[RagSystemRoadmap/FineTunedEmbeddingsForArabicDomain.md|fine-tuning the embeddings]] on Arabic educational texts to better align the vector space with the domain vocabulary.
*   **Query ambiguity** causes poor results when short, vague queries like "how does it work?" generate generic embeddings that match many irrelevant documents.
    *   *Why it happens*: The embedding for ambiguous queries lacks specific semantic signals to distinguish between different topics.
    *   *How to fix it*: Implement [[RagSystemRoadmap/DominantSubjectFiltering.md|subject filtering]] using the [[RagSystemRoadmap/DropdownsForGradeTermSubject.md|UI dropdowns]] to narrow the search context, or use query expansion techniques to add context.

## Examples

*   **Real-world analogy**: Imagine you're at a library looking for books about "canine training." Instead of checking every book's index for the word "canine," you tell a librarian your interest. The librarian mentally converts your request into a concept map of "dogs," "obedience," "behavior," and finds books matching this conceptual profile, not just the exact words. The embedding model is that librarian, converting your query into a conceptual profile for the vector database.
*   **Technical example with code**: When a student asks "Explain Newton's first law," the system:
    ```python
    # 1. Clean the query (same process as document chunks)
    query = "Explain Newton's first law"
    cleaned_query = "explain newton's first law"  # after lowercasing, etc.
    
    # 2. Generate embedding using the same model as documents
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('intfloat/multilingual-e5-small')
    query_embedding = model.encode(cleaned_query)
    
    # 3. Normalize for cosine similarity search
    import numpy as np
    normalized_embedding = query_embedding / np.linalg.norm(query_embedding)
    
    # 4. This normalized_embedding is sent to Qdrant for similarity search
    #    It will match chunks about "inertia," "objects at rest," etc.
    print(f"Embedding shape: {normalized_embedding.shape}")  # (384,)
    print(f"Sample values: {normalized_embedding[:5]}")  # [0.023, -0.145, 0.067, ...]
    ```

## Advanced notes

*   For production systems, consider [[RagSystemRoadmap/AsyncSearchForSpeed.md|asynchronous processing]] of query embeddings to handle multiple simultaneous user requests without blocking the [[RagSystemRoadmap/ApiFastapi.md|FastAPI endpoint]].
*   The choice of [[RagSystemRoadmap/DistanceCosineVectorSize384.md|cosine distance]] over other metrics like Euclidean distance is particularly beneficial for semantic similarity as it focuses on vector direction rather than magnitude, making it more robust to text length variations.
*   [[RagSystemRoadmap/CacheFrequentQueriesRedis.md|Caching frequent query embeddings]] can significantly reduce latency for common questions while maintaining the [[RagSystemRoadmap/AnalyticsDashboard.md|analytics]] through [[RagSystemRoadmap/QueryLoggingFeedback.md|query logging]].
*   In advanced implementations, query embeddings can be dynamically adjusted based on conversation history or user context to provide more personalized retrieval, though this requires careful [[RagSystemRoadmap/Evaluation.md|evaluation]] to avoid introducing bias.

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

