---
id: rag-system-roadmap-tips-save-chunk-id-page-and-source_1120003d
type: leaf
parent: RagSystemRoadmap/Tips.md
children:
prereqs:
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/VectorMetadataSourcePageSubject.md
  - RagSystemRoadmap/UpsertPointsIdVectorPayload.md
  - RagSystemRoadmap/DisplayCitationsSourcePage.md
  - RagSystemRoadmap/KeepOverlapOf50100Tokens.md
see_also:
  - RagSystemRoadmap/Phase3EmbeddingLayer.md
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
summary: Always save the chunk_id, source document, and page number as metadata when creating text chunks for a RAG system to enable accurate source citation and troubleshooting.
model: provider/model
run_id: manual
---

# Save chunk_id, page, and source

## Summary
Always save the chunk_id, source document, and page number as metadata when creating text chunks for a RAG system to enable accurate source citation and troubleshooting.

## Key concepts
*   **Chunk ID:** A unique identifier for each text segment, acting like a precise library call number for a specific paragraph, which is essential for retrieving and referencing the exact piece of information later.
*   **Source Document:** The origin file (e.g., `physics_grade10.pdf`) from which the text was extracted, providing the broader context and authority for the information within the chunk.
*   **Page Number:** The specific location within the source document, functioning like a page number in a book citation, allowing users and developers to find the original text for verification.
*   **Metadata Payload:** The structured data (including chunk_id, source, and page) that is stored alongside the vector embedding in the database, ensuring this contextual information is attached to the semantic representation of the text.

## Why it matters
*   **Enables Source Citation:** Without saving the page and source, the system cannot show where an answer came from, like an assistant giving a fact but refusing to name the book it was found in, which breaks trust and prevents verification.
*   **Facilitates Debugging:** When a RAG model gives a strange answer, developers can use the chunk_id to instantly retrieve the exact text chunk that was used, dramatically speeding up the process of identifying retrieval or data quality issues.
*   **Improves User Trust:** Displaying a source and page number, such as "According to 'Advanced Mathematics, page 45'...", makes the system's responses feel grounded and authoritative, rather than like a black box.
*   **Supports Data Management:** If the source document is updated or found to contain errors, knowing which chunks and pages are affected allows for targeted updates or removal of data from the [[RagSystemRoadmap/Phase4VectorDatabaseLayer.md|Vector Database Layer]].

## Core steps
*   **Generate a unique chunk_id during processing.** This creates a permanent, retrievable identifier for each piece of text. For example, use a UUID or a combination of source filename and chunk index.
    ```python
    # Example: Generating a unique chunk_id
    import uuid
    chunk_id = str(uuid.uuid4())  # Result: 'abc123-...'
    # Or, use a deterministic ID
    # chunk_id = f"{source_document}_page{page_number}_chunk{chunk_index}"
    ```
*   **Extract and preserve the source filename and page number from the text extraction phase.** This links the chunk back to its origin. Tools like [[RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md|PyMuPDF or Tesseract]] often provide this data during [[RagSystemRoadmap/PdfTextExtraction.md|PDF Text Extraction]].
    ```python
    # Example: Metadata from a PDF extraction process
    metadata = {
        "chunk_id": chunk_id,
        "source": "biology_grade11_textbook.pdf",
        "page": 12
    }
    ```
*   **Store this metadata as a payload when upserting the vector into the database.** This attaches the contextual information directly to the vector embedding for later retrieval. In [[RagSystemRoadmap/DatabaseQdrant.md|Qdrant]], this is done using the `payload` parameter.
    ```python
    # Example: Upserting a point with metadata in Qdrant
    from qdrant_client import models
    client.upsert(
        collection_name="textbook_chunks",
        points=[
            models.PointStruct(
                id=chunk_id,
                vector=[0.1, 0.2, ...], # Your 384-dim vector
                payload=metadata # Includes source and page
            )
        ]
    )
    ```

## Checks
*   **After inserting a document, can you retrieve a chunk and see its source and page?**
    *   ✔ Run a search and verify the returned payload contains `{"source": "expected_file.pdf", "page": 5}`.
    *   ✘ Getting a result where the payload is empty or missing the `source` field.
*   **Do all chunks from a multi-page PDF have unique IDs and correct page numbers?**
    *   ✔ Chunk from page 1 has `page: 1`, chunk from page 2 has `page: 2`, and all `chunk_id` values are different.
    *   ✘ All chunks have `page: 1` or multiple chunks share the same `chunk_id`.
*   **If you query for a specific fact, does the citation link back to the correct location in the original document?**
    *   ✔ A question about "photosynthesis" returns a chunk that, when you check the original PDF on the cited page, contains the exact text.
    *   ✘ The citation points to a page about a completely different topic.

## Failure modes
*   **Mistake: Using non-unique or sequential numbers as chunk_ids.**
    *   **Why it happens:** It's simpler to just use an incrementing integer (1, 2, 3...) during a single processing run.
    *   **How to fix it:** Always use a UUID or a composite ID that includes the source filename and a unique index to guarantee global uniqueness, especially when adding documents from multiple sources over time.
*   **Mistake: Losing page numbers during the chunking process.**
    *   **Why it happens:** The text extraction tool provides page data, but a custom chunking script fails to carry this metadata forward when splitting the text, treating it as one long string.
    *   **How to fix it:** Ensure your [[RagSystemRoadmap/ChunkingMethods.md|chunking method]] or library (like [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md|RecursiveChunking]]) propagates the source and page number metadata to each new child chunk it creates.
*   **Mistake: Storing metadata in a separate system from the vector database.**
    *   **Why it happens:** Trying to manage complexity by keeping vectors in one database and metadata in another (e.g., SQL).
    *   **How to fix it:** Always use the native payload functionality of your vector database (like [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md|Qdrant's payload]]) to co-locate the metadata with the vector, ensuring atomicity and fast retrieval.

## Examples
*   **Real-World Analogy:** Think of a highly organized warehouse. Every box (chunk) has a unique barcode (chunk_id). The shipping manifest (metadata) attached to the box lists the factory it came from (source) and the specific pallet it was on (page). When an order comes in, you can not only find the box instantly but also trace its entire origin story.
*   **Code Snippet:** Here is a complete example of creating a chunk with its metadata during a processing pipeline.
    ```python
    # Example: Creating a chunk with metadata
    def create_chunk(text, source, page, chunk_index):
        chunk_id = f"{source}_p{page}_c{chunk_index}"
        metadata = {
            "chunk_id": chunk_id,
            "source": source,
            "page": page,
            "text": text  # The actual text content
        }
        return metadata

    # Usage
    my_chunk = create_chunk(
        text="The mitochondria is the powerhouse of the cell.",
        source="cell_biology.pdf",
        page=42,
        chunk_index=0
    )
    # my_chunk is now ready to be embedded and stored in the vector DB
    ```

## Advanced notes
*   For even finer-grained citations, consider storing the starting and ending character offsets within the page, which is crucial for [[RagSystemRoadmap/DisplayCitationsSourcePage.md|displaying precise citations]] in the UI.
*   The `chunk_id` can be used as the point `id` in [[RagSystemRoadmap/DatabaseQdrant.md|Qdrant]], creating a direct one-to-one relationship and simplifying record updates or deletions based on content.
*   This pattern is part of a larger strategy for [[RagSystemRoadmap/SaveStructuredJsonWithMetadata.md|saving structured JSON with metadata]], which can be extended to include other useful fields like subject, grade level, or extraction timestamp for more powerful filtering and [[RagSystemRoadmap/AnalyticsDashboard.md|analytics]].

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

