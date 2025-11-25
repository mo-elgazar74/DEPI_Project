---
id: rag-system-roadmap-chunking-regex-recursive-splitter_d836d8a9
type: leaf
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
prereqs:
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/PreprocessingPymupdfTesseractSpacy.md
see_also:
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/EmbeddingGeneration.md
  - RagSystemRoadmap/Output.md
  - RagSystemRoadmap/QdrantSetup.md
  - RagSystemRoadmap/Goal.md
summary: Recursive chunking is a text-splitting method that uses a hierarchy of separators, such as paragraphs and sentences, to break documents into coherent, nested units, which is essential for creating high-quality context in [[RetrievalPrecisionKRecallK|retrieval systems]].
model: provider/model
run_id: manual
---

# **Chunking:** Regex / Recursive Splitter

## Summary
Recursive chunking is a text-splitting method that uses a hierarchy of separators, such as paragraphs and sentences, to break documents into coherent, nested units, which is essential for creating high-quality context in [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval systems]].

## Key concepts
*   **Recursive Character Text Splitter:** A "divide and conquer" algorithm for text. It first tries to split a large document using a primary separator (like double newlines for paragraphs). If the resulting chunks are still too large, it recursively applies the next separator in the hierarchy (like single newlines or periods) until all chunks are within the desired size range.
    *   *Example:* Think of it like cutting a loaf of bread: you first slice it into large chunks (paragraphs), and if a chunk is too thick, you slice it again into smaller pieces (sentences) until each piece is the right size for a sandwich.
*   **Chunk Size and Overlap:** `chunk_size` is the target number of characters or tokens for a final chunk. `chunk_overlap` is a small number of characters/tokens shared between consecutive chunks to preserve context and prevent ideas from being cut off abruptly.
    *   *Example:* With a `chunk_size` of 400 and `chunk_overlap` of 50, the end of one chunk will be the first 50 characters of the next chunk, ensuring a smooth transition.
*   **Separator Hierarchy:** An ordered list of regex patterns or strings that define the splitting priority. The splitter starts with the first, most general separator, and moves to more granular ones if needed.
    *   *Code Snippet:*
        ```python
        # A typical hierarchy for English text
        separators = [
            "\n\n",    # Split by paragraphs first
            "\n",      # Then by lines
            ". ",      # Then by sentences
            "! ", "? ", ", ", " ", ""  # Finally, by words or characters
        ]
        ```

## Why it matters
*   It preserves logical document structure better than fixed-length splitting, leading to chunks with more self-contained meaning, which is crucial for [[RagSystemRoadmap/SemanticSearch.md|semantic search]].
*   The method is highly adaptable; by changing the separator hierarchy, you can optimize it for different document types like code (split by functions), markdown (split by headers), or general prose.
*   It directly combats the problem of "context fragmentation," where a single idea is split across two chunks, making it harder for the [[RagSystemRoadmap/EmbeddingGeneration.md|embedding model]] to represent the concept accurately.

## Core steps
*   **Define the separator hierarchy.** Action: Create an ordered list of regex patterns. Reason: This determines the logical units of your text and the splitting priority. Example: For code, you might prioritize splitting by functions (`\n\ndef `) before splitting by lines.
    *   *Code Snippet:*
        ```python
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""]
        )
        ```
*   **Configure chunk size and overlap.** Action: Set `chunk_size` and `chunk_overlap` parameters. Reason: To control the final chunk granularity and maintain context between chunks. Example: A size of 400-600 tokens is a common starting point for question-answering systems, as defined in [[RagSystemRoadmap/FixedLength400600Tokens.md|fixed length chunking]].
*   **Execute the split.** Action: Call the splitter's `.split_text(document)` method. Reason: To process the document and produce a list of text chunks. Example: This is a key part of the [[RagSystemRoadmap/Phase2PreprocessingChunking.md|preprocessing and chunking phase]].
    *   *Code Snippet:*
        ```python
        documents = ["This is a long document...", "Another document..."]
        all_chunks = []
        for doc in documents:
            chunks = text_splitter.split_text(doc)
            all_chunks.extend(chunks)
        # all_chunks is now ready for the next phase: [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]]
        ```

## Checks
*   **Are chunks respecting natural boundaries?**
    *   ✔ A chunk ends at the conclusion of a sentence or paragraph.
    *   ✘ A chunk cuts off mid-sentence or in the middle of a list item.
*   **Is the overlap sufficient to prevent context loss?**
    *   ✔ The last sentence of one chunk flows logically into the first sentence of the next chunk.
    *   ✘ A key term or concept is introduced at the very end of a chunk and is absent from the beginning of the next.
*   **Is the chunk size distribution consistent?**
    *   ✔ Most chunks are close to the target `chunk_size`.
    *   ✘ There is a high variance, with many very short and a few extremely long chunks, indicating a poor separator hierarchy.

## Failure modes
*   **Mistake:** Using a single, naive separator like only spaces. **Why it happens:** Underestimating the importance of document structure. **How to fix it:** Implement a proper hierarchy of separators that matches the document's language and format, as seen in [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md|recursive chunking by headers]].
*   **Mistake:** Setting `chunk_overlap` to zero. **Why it happens:** Trying to minimize data duplication without understanding its purpose. **How to fix it:** Always use an overlap, typically 10-20% of the chunk size (e.g., [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md|50-100 tokens]]), to preserve semantic continuity.
*   **Mistake:** Chunk size is too large or too small for the [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|embedding model]]'s context window. **Why it happens:** Not aligning preprocessing with model capabilities. **How to fix it:** Choose a chunk size that, after tokenization, leaves room for the user query and system prompts in the generator's context window. Use [[RagSystemRoadmap/AdjustChunkSize.md|adjust chunk size]] based on evaluation.

## Examples
*   **Real-World Analogy:** Organizing a book into a detailed table of contents. You don't just split the book into 10-page segments. Instead, you first divide it into Parts, then Chapters, then Sections, and finally Subsections. Recursive chunking does the same for text, creating a hierarchy of meaningful segments.
*   **Code Example with LangChain:** This shows a practical implementation for educational content.
    ```python
    # Specialized splitter for educational material with headers
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    
    educational_splitter = RecursiveCharacterTextSplitter(
        # Aim for chunks that fit our embedding model context
        chunk_size=500,
        # Keep overlap to connect related ideas across chunks
        chunk_overlap=75,
        # Prioritize splitting by major headers, then sub-headers, then paragraphs.
        separators=[
            "\n## ",   # Major heading (Markdown H2)
            "\n### ",  # Sub-heading (Markdown H3)
            "\n\n",    # Paragraph
            "\n",      # Line break
            ". ", "! ", "? ", " ", ""
        ]
    )
    
    textbook_chapter_text = "# Physics\n## Newton's Laws\nAn object at rest stays..."
    chunks = educational_splitter.split_text(textbook_chapter_text)
    # The first chunk might be "Physics", the second "Newton's Laws...", etc.
    # These chunks are now ready for [[RagSystemRoadmap/ConvertTextChunksIntoDenseVectors384Dim.md|vector conversion]].
    ```

## Advanced notes
*   For highly structured documents like Markdown, consider a [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md|header-aware recursive splitter]] that uses the header levels (`#`, `##`, etc.) as primary separators to keep sections self-contained.
*   While powerful, recursive splitting is still syntax-based. For the highest semantic coherence, explore [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md|semantic chunking]], which uses embedding similarity to split text at topic boundaries.
*   Always pair your chunking strategy with robust [[RagSystemRoadmap/TextCleaning.md|text cleaning]] and metadata preservation (e.g., [[RagSystemRoadmap/SaveChunkIdPageAndSource.md|saving source and page number]]) to maximize [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval quality]] during [[RagSystemRoadmap/ContextConstruction.md|context construction]].

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

