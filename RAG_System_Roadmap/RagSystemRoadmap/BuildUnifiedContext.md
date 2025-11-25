---
id: rag-system-roadmap-dominant-subject-filtering-build-unified-context_0e9698cc
type: leaf
parent: RagSystemRoadmap/DominantSubjectFiltering.md
children:
prereqs:
  - RagSystemRoadmap/PickChunksFromMainSubject.md
  - RagSystemRoadmap/QueryQdrantForTopKChunks.md
  - RagSystemRoadmap/EmbedUserQuery.md
  - RagSystemRoadmap/Phase5RetrievalLayer.md
  - RagSystemRoadmap/VectorMetadataSourcePageSubject.md
see_also:
  - RagSystemRoadmap/Phase6GenerationLayer.md
  - RagSystemRoadmap/DominantSubjectFiltering.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
summary: This process combines the most relevant text chunks retrieved from the vector database into a single, coherent context window that provides comprehensive information for the language model to generate accurate, well-supported answers.
model: provider/model
run_id: manual
---

# Build unified context

## Summary

This process combines the most relevant text chunks retrieved from the vector database into a single, coherent context window that provides comprehensive information for the language model to generate accurate, well-supported answers.

## Key concepts

*   **Context window** is the fixed-size block of text a language model can process at once; we must strategically fill it with the most valuable information from our search results.
    *   Example: Like packing a suitcase for a trip, you must choose which items (text chunks) to include, ensuring you have everything you need without exceeding the weight limit (token limit).
*   **Semantic fusion** means merging retrieved snippets logically, not just concatenating them, to create a narrative flow that the model can easily understand.
    *   Example: Instead of just listing facts, you might order chunks chronologically for a historical question or group them by theme for a complex analytical query.
*   **Token limit awareness** involves carefully counting the tokens in your combined context to ensure it stays within the model's maximum capacity, preventing truncation of crucial information.
    *   Example: Using the `tiktoken` library to count tokens before sending the final prompt: `encoding = tiktoken.encoding_for_model("gpt-4")`.

## Why it matters

*   A unified context prevents the model from receiving disjointed, contradictory, or incomplete information, which is a primary cause of hallucinations and factual errors in [[RagSystemRoadmap/GenerationFactualityFluency.md|generated responses]].
*   It allows the system to present a complete picture by combining details from multiple source documents or different sections of a long document, leading to more comprehensive and useful answers for the user.
*   Efficient context construction directly impacts cost and latency, as stuffing the context with irrelevant text wastes computational resources and slows down the GenerationLayer|generation step.

## Core steps

*   **Aggregate top-K chunks** from the [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|vector search results]], which involves collecting the text and metadata of the most similar document pieces to the user's query.
    *   Reason: To gather all candidate pieces of information that could be relevant to answering the question.
    *   Example: Your search for "photosynthesis" returns 10 chunks from biology textbooks; this step collects all 10.
*   **Deduplicate overlapping content** by identifying and removing redundant sentences or paragraphs that appear across multiple chunks, often a result of [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md|chunking with overlap]].
    *   Reason: To maximize the information density of the final context and avoid wasting tokens on repeated information.
    *   Example: Using a simple heuristic to remove duplicate sentences:
        ```python
        unique_sentences = list(set(sentences_from_all_chunks))
        ```
*   **Sort and structure logically** by ordering the remaining chunks in a way that makes sense for the query, such as by relevance score, chronological order, or thematic grouping.
    *   Reason: To provide a coherent "story" for the LLM, making it easier to synthesize information and produce a well-structured answer.
    *   Example: For a query on "stages of mitosis," you would order the chunks to describe prophase, metaphase, anaphase, and telophase in sequence.
*   **Concatenate within token limit** by calculating the total token count of your structured chunks and trimming from the end (or least relevant parts) if the total exceeds the model's context window.
    *   Reason: To ensure the final prompt is technically valid and will be processed completely by the LLM without silent truncation.
    *   Example: The model's context window is 4096 tokens. Your prompt + user question uses 500 tokens, so you can only use ~3596 tokens for the unified context.

## Checks

*   Is the final context a coherent text that a human could read and understand?
    *   ✔ The context flows from an introduction to the topic, through key concepts, to specific details.
    *   ✘ The context is a random assortment of disjointed facts and sentence fragments.
*   Does the combined text length stay safely within the model's token limit after adding the system prompt and user question?
    *   ✔ Total tokens for system prompt + context + user query = 3800, which is under a 4096 limit.
    *   ✘ You get an error from the API because the total token count exceeds the maximum context length.
*   Is all critically relevant information from the top search results present, or was important data cut off during truncation?
    *   ✔ The answer to the user's core question is fully supported by multiple parts of the context.
    *   ✘ The model's answer is missing a key detail that you know was in the 3rd search result, which was trimmed.

## Failure modes

*   **Mistake**: Simply concatenating chunks in the order they were retrieved without logical structuring.
    *   **Why it happens**: It's the fastest and most straightforward implementation, but it ignores narrative flow.
    *   **How to fix it**: Implement a simple sorting mechanism based on [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|metadata]] like page number or a predefined logical structure in the source material.
*   **Mistake**: Allowing the context to exceed the token limit, causing the end of the context to be silently truncated.
    *   **Why it happens**: Failing to accurately count tokens or being overly optimistic about how much text can fit.
    *   **How to fix it**: Integrate a token counting library (e.g., `tiktoken` for OpenAI) and implement a safe truncation strategy that removes chunks starting from the least relevant.
*   **Mistake**: Including multiple chunks that say the same thing, wasting valuable context space on redundancy.
    *   **Why it happens**: The [[RagSystemRoadmap/ChunkingMethods.md|chunking strategy]] used overlap, or different documents contain similar introductory paragraphs.
    *   **How to fix it**: Add a deduplication step that uses fuzzy matching on sentences or paragraphs to filter out near-identical content before combining.

## Examples

*   **Real-world analogy**: Building a unified context is like a lawyer preparing a closing argument. They don't just read random excerpts from witness testimonies and evidence documents to the jury. Instead, they select the most impactful quotes and facts, arrange them into a compelling narrative that supports their case, and ensure the entire presentation fits within the allotted time.
*   **Code snippet**: A simplified function to build the context, demonstrating sorting by a relevance score and truncation by character count (a proxy for tokens).
    ```python
    def build_unified_context(retrieved_chunks, max_length=6000):
        # Sort chunks by score (highest first)
        sorted_chunks = sorted(retrieved_chunks, key=lambda x: x['score'], reverse=True)
        
        # Start with an empty context
        context = ""
        
        # Add chunks until we hit the length limit
        for chunk in sorted_chunks:
            chunk_text = chunk['text']
            # Check if adding this chunk would exceed the limit
            if len(context) + len(chunk_text) <= max_length:
                # Add a separator and the chunk text
                if context: # If context is not empty, add a separator first
                    context += "\n\n---\n\n"
                context += chunk_text
            else:
                # Stop if we can't fit the next chunk
                break
        return context
    ```

## Advanced notes

*   For complex queries, consider implementing a [[RagSystemRoadmap/OptionallyRerankResults.md|re-ranker]] *before* building the unified context; a cross-encoder model can more accurately re-order the top-K initial results, ensuring the most relevant chunks are prioritized and less likely to be cut off during truncation.
*   The logic for building context can be integrated directly within your [[RagSystemRoadmap/RetrieverLlamaindexLangchain.md|retriever framework]] (like LlamaIndex or LangChain), which often provides built-in utilities for stuffing, refining, or mapping over retrieved documents, abstracting away much of the manual chunk management.
*   In a [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] setup, you will be combining results from both keyword and vector searches; a robust context builder must handle the fusion of these two result sets, potentially using a reciprocal rank fusion (RRF) algorithm to interleave them optimally before final concatenation.

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

