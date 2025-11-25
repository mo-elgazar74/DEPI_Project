---
id: rag-system-roadmap-dominant-subject-filtering-pick-chunks-from-main-subject_a39b3bf1
type: leaf
parent: RagSystemRoadmap/DominantSubjectFiltering.md
children:
prereqs:
  - RagSystemRoadmap/QueryQdrantForTopKChunks.md
  - RagSystemRoadmap/BuildUnifiedContext.md
  - RagSystemRoadmap/VectorMetadataSourcePageSubject.md
  - RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md
  - RagSystemRoadmap/Phase5RetrievalLayer.md
see_also:
  - RagSystemRoadmap/Phase6GenerationLayer.md
  - RagSystemRoadmap/DominantSubjectFiltering.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
summary: This component filters retrieved text chunks to select only those from the dominant subject of the user's query, ensuring the final answer is built from contextually relevant information and avoids contradictory or off-topic content.
model: provider/model
run_id: manual
---

# Pick chunks from main subject

## Summary
This component filters retrieved text chunks to select only those from the dominant subject of the user's query, ensuring the final answer is built from contextually relevant information and avoids contradictory or off-topic content.

## Key concepts
*   **Dominant Subject:** The primary topic or theme of a user's question. For example, in the query "Explain photosynthesis and its role in plant growth," the dominant subject is "photosynthesis," not the secondary concept "plant growth."
*   **Subject Filtering:** The process of analyzing retrieved chunks and selecting only those that are tagged with or primarily discuss the dominant subject identified in the query, discarding chunks from other subjects even if they are semantically similar.
*   **Metadata Tagging:** A prerequisite step where each text chunk is labeled with a subject tag (e.g., `subject: "biology"`) during the [[RagSystemRoadmap/Phase2PreprocessingChunking.md|preprocessing phase]], which is stored in the [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|vector metadata]] and used for this filtering.
*   **Context Purity:** The goal of this process is to increase the signal-to-noise ratio in the context passed to the GenerationLayer|generation layer, leading to more factual and focused answers.

## Why it matters
*   **Prevents Contradictory Information:** Without filtering, a query about "Newton's laws of motion" might retrieve chunks from both a physics book (correct) and a history book discussing the "Newton" monetary system (incorrect), leading to a confusing or wrong answer.
*   **Improves Answer Focus:** By ensuring the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM generator]] only sees context from the main subject, the final response stays on-topic and doesn't drift into related but irrelevant areas.
*   **Enhances Factual Accuracy:** It leverages the structured organization of knowledge (e.g., [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|collections per subject]]) to ground the answer in authoritative content from the correct domain, which is critical for an [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md|educational system]].
*   **Optimizes Context Window Usage:** It makes efficient use of the limited context window by filling it with the most relevant chunks from the correct subject, rather than a mix of subjects.

## Core steps
*   **Identify the dominant subject from the user query** to establish the filtering criterion. This can be done with a simple keyword lookup against a list of known subjects or a lightweight classifier.
    ```python
    # Example: Simple keyword-based subject identification
    user_query = "What is the formula for calculating kinetic energy?"
    known_subjects = ["physics", "biology", "mathematics"]
    
    # Logic to find the most relevant subject
    if "kinetic energy" in user_query:
        dominant_subject = "physics"
    # dominant_subject is now used to filter chunks
    ```
*   **Retrieve top-K chunks via [[RagSystemRoadmap/SemanticSearch.md|semantic search]]** from the [[RagSystemRoadmap/DatabaseQdrant.md|vector database]] using the embedded query, which fetches chunks based on semantic similarity regardless of their subject tag.
*   **Filter the retrieved chunks** by comparing the `subject` metadata of each chunk against the identified dominant subject, keeping only those that match.
    ```python
    # After retrieving top_k_chunks from Qdrant
    filtered_chunks = [
        chunk for chunk in top_k_chunks
        if chunk.metadata.get('subject') == dominant_subject
    ]
    ```
*   **Pass the filtered list to [[RagSystemRoadmap/ContextConstruction.md|context construction]]** to be combined into a unified context string for the [[RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md|system prompt]], ensuring the generator only sees relevant information.

## Checks
*   ✔ **Check:** Does a query about "cell mitosis" return chunks tagged exclusively with `biology`?
    *   ✔ Correct: All retrieved chunks have `subject: "biology"`.
    *   ✘ Incorrect: Chunks with `subject: "chemistry"` (e.g., about chemical reactions) are included.
*   ✔ **Check:** If a query contains multiple potential subjects (e.g., "gravity in physics and orbits in astronomy"), does the system correctly identify a single dominant subject or handle the ambiguity?
    *   ✔ Correct: The system uses a disambiguation rule or asks the user for clarification via the [[RagSystemRoadmap/Frontend.md|UI]].
    *   ✘ Incorrect: The system randomly picks one subject, potentially providing an incomplete answer.
*   ✔ **Check:** Is the subject metadata being correctly populated during [[RagSystemRoadmap/Phase2PreprocessingChunking.md|chunking]] and saved to the [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|vector database]]?
    *   ✔ Correct: A sample check of the database confirms chunks have accurate `subject` fields.
    *   ✘ Incorrect: The `subject` field is `null` or contains incorrect values, rendering filtering useless.

## Failure modes
*   **Mistake:** Incorrect or missing subject tags on chunks.
    *   **Why it happens:** The [[RagSystemRoadmap/PreprocessingPymupdfTesseractSpacy.md|preprocessing pipeline]] failed to assign the correct subject tag, perhaps due to a misconfiguration in [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|collection creation]] or errors in [[RagSystemRoadmap/TextCleaning.md|text cleaning]].
    *   **How to fix it:** Implement a data validation step after [[RagSystemRoadmap/Phase2PreprocessingChunking.md|chunking]] to verify subject tags against a controlled vocabulary before [[RagSystemRoadmap/IndexAddNewDocuments.md|indexing]].
*   **Mistake:** Overly broad or incorrect dominant subject identification from the query.
    *   **Why it happens:** A naive keyword matcher might misclassify "What is Python?" as referring to the snake (`biology`) instead of the programming language (`computer_science`).
    *   **How to fix it:** Upgrade the subject identification to use a more sophisticated method, such as a small, fine-tuned model for intent classification, or leverage the [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|embedding model]] itself for better topic clustering.
*   **Mistake:** Over-filtering, where valid, highly relevant chunks are discarded because of a strict subject match.
    *   **Why it happens:** A query like "How does calculus apply to economics?" has a dominant subject of "calculus," but chunks tagged "economics" that discuss calculus applications are also highly relevant.
    *   **How to fix it:** Implement a hybrid approach where the top-N most semantically similar chunks are kept regardless of subject, and then a secondary filter is applied, or use a [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] that boosts chunks from the dominant subject.

## Examples
*   **Real-World Analogy:** Imagine a librarian helping a student. The student asks, "I need information on the French Revolution." A basic assistant might bring back books on "revolutions" in general, including the Industrial Revolution. A smart librarian, using "dominant subject filtering," would go directly to the "French History" section and only pick books specifically about the French Revolution, ignoring other types of revolutions.
*   **Code Snippet:** This shows how the filtering logic integrates into a retrieval function.
    ```python
    def retrieve_and_filter(query, dominant_subject, top_k=10):
        # Step 1: Embed the query
        query_embedding = embedder.embed_query(query)
        
        # Step 2: Perform semantic search (unfiltered)
        search_results = qdrant_client.search(
            collection_name="text_chunks",
            query_vector=query_embedding,
            limit=top_k * 3  # Retrieve more initially to filter down
        )
        
        # Step 3: Filter by dominant subject
        filtered_results = [
            hit for hit in search_results
            if hit.payload.get("subject") == dominant_subject
        ]
        
        # Step 4: Return the top-K filtered results
        return filtered_results[:top_k]
    ```

## Advanced notes
*   For highly interdisciplinary queries, consider implementing a **subject scoring system** instead of a binary filter, where chunks are weighted based on their subject relevance to the query's intent.
*   This component's effectiveness is directly tied to the quality of the [[RagSystemRoadmap/DominantSubjectFiltering.md|overall dominant subject filtering strategy]] defined earlier in the pipeline, including how subjects are defined and tagged.
*   The filtering logic can be extended to use other metadata fields, such as `grade_level` or `term`, in conjunction with `subject` for even more precise retrieval, leveraging the [[RagSystemRoadmap/DropdownsForGradeTermSubject.md|UI dropdowns]] for user input.

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

