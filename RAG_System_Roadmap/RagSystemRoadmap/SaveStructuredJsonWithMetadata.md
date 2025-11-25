---
id: rag-system-roadmap-pdf-text-extraction-save-structured-json-with-metadata_0db09d8f
type: leaf
parent: RagSystemRoadmap/PdfTextExtraction.md
children:
prereqs:
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
  - RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md
  - RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md
see_also:
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/Phase2PreprocessingChunking.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/SentenceBasedUsingSpacy.md
summary: This process transforms raw extracted text into structured JSON documents enriched with metadata, creating organized data packages that are essential for effective retrieval and processing within the [[RagSystemRoadmap|RAG system]].
model: provider/model
run_id: manual
---

# Save structured JSON with metadata

## Summary
This process transforms raw extracted text into structured JSON documents enriched with metadata, creating organized data packages that are essential for effective retrieval and processing within the [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]].

## Key concepts
*   **Structured JSON** is a standardized data format that organizes information into key-value pairs, making it predictable and easy for computers to parse, unlike raw text which is unstructured and variable.
    *   *Example: Think of structured JSON as a pre-filled tax form with labeled fields (name, income, deductions), while raw text is like a handwritten note about your finances—both contain the information, but the form is much faster to process.*
*   **Metadata** is "data about data"—additional information that describes the content, such as its source, page number, or subject, which doesn't appear in the main text but provides crucial context.
    *   *Example: In a library, the book's content is the data, while the card catalog entry (author, title, publication year, genre) is the metadata that helps you find and understand the book's context.*
*   **Chunk ID** is a unique identifier assigned to each segment of text after [[RagSystemRoadmap/ChunkingMethods.md|chunking]], acting like a barcode that allows the system to track and retrieve that specific piece of content from the [[RagSystemRoadmap/DatabaseQdrant.md|vector database]].
    ```json
    {
      "chunk_id": "science_grade10_term1_page42_chunk3",
      "content": "Photosynthesis converts light energy into chemical energy...",
      "metadata": {
        "source": "biology_textbook.pdf",
        "page": 42,
        "subject": "Science"
      }
    }
    ```

## Why it matters
*   Enables precise [[RagSystemRoadmap/DisplayCitationsSourcePage.md|citation and source tracking]] by permanently linking text chunks to their origin, so the system can show users exactly where an answer came from.
    *   *Example: A student asking "What is Newton's First Law?" can be shown the specific paragraph and page number from their physics textbook, building trust in the answer.*
*   Provides the necessary context for [[RagSystemRoadmap/SemanticSearch.md|semantic search]] and [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] algorithms to filter and prioritize results based on criteria like subject or grade level, not just keyword matching.
    *   *Example: When a 5th-grade student asks about "force," the metadata ensures they get results from elementary science materials instead of advanced physics papers.*
*   Creates a clean, auditable data pipeline for [[RagSystemRoadmap/Phase9ContinuousImprovement.md|continuous improvement]], allowing developers to analyze which sources and chunks lead to the best answers and which need improvement.

## Core steps
*   **Action:** Create a JSON schema that defines the structure for your chunks and metadata. **Reason:** This ensures consistency across all documents, making the data predictable for downstream systems like the [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|vector database]]. **Example:**
    ```python
    # Define the expected structure
    chunk_schema = {
        "chunk_id": str,           # Unique identifier
        "content": str,            # The actual text
        "metadata": {
            "source": str,         # File name or ID
            "page": int,           # Page number
            "subject": str,        # e.g., "Math", "Science"
            "grade": str,          # e.g., "Grade 5"
            "term": str            # e.g., "Term 1"
        }
    }
    ```
*   **Action:** Populate the schema with the extracted text and its associated metadata from the [[RagSystemRoadmap/PdfTextExtraction.md|PDF extraction]] and [[RagSystemRoadmap/TextCleaning.md|cleaning]] phases. **Reason:** This bundles the raw content with its contextual information into a single, portable package. **Example:**
    ```python
    # After text extraction and cleaning
    structured_chunk = {
        "chunk_id": f"doc123_page_{page_num}_chunk_{chunk_index}",
        "content": cleaned_text_chunk,
        "metadata": {
            "source": "advanced_physics.pdf",
            "page": page_num,
            "subject": "Physics",
            "grade": "Grade 12",
            "term": "Term 2"
        }
    }
    ```
*   **Action:** Serialize the populated structure into a JSON string and save it to a file. **Reason:** JSON is a universal format that can be easily stored, transferred, and loaded by the [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]] and [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md|database upsert]] processes. **Example:**
    ```python
    import json

    # Save to a file
    with open('structured_chunks.jsonl', 'a') as f:
        json.dump(structured_chunk, f)
        f.write('\n')  # Newline-delimited JSON for easy processing
    ```

## Checks
*   **Is every chunk linked to its source and page?**
    *   ✔ A chunk about "photosynthesis" has `"source": "biology_textbook.pdf", "page": 42`.
    *   ✘ A chunk about "quadratic equations" has no source information, making it impossible to cite.
*   **Does the JSON structure remain consistent for all chunks?**
    *   ✔ All JSON objects have the same top-level keys (`chunk_id`, `content`, `metadata`) with the same data types.
    *   ✘ Some chunks are missing the `metadata` field, or the `page` field is sometimes a string (`"42"`) instead of a number (`42`), causing errors during [[RagSystemRoadmap/IndexAddNewDocuments.md|database indexing]].
*   **Can you easily reconstruct the original document order from the chunks?**
    *   ✔ The `chunk_id` or `page` number allows you to sort chunks to see how the original content flowed.
    *   ✘ Chunks are saved in a random order, and the relationship between consecutive ideas in the original text is lost.

## Failure modes
*   **Mistake:** Saving unstructured text blobs without metadata. **Why it happens:** The focus is solely on the content extraction, overlooking the need for contextual information. **How to fix it:** Integrate metadata collection as a mandatory step immediately after [[RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md|text extraction]] and before the [[RagSystemRoadmap/SaveChunkIdPageAndSource.md|chunk saving]] process.
*   **Mistake:** Using inconsistent or ambiguous metadata values (e.g., "Sci," "Science," "science"). **Why it happens:** Lack of a controlled vocabulary or validation step for metadata fields. **How to fix it:** Define and enforce a standard set of values for fields like `subject` and `grade`, perhaps aligned with the options in [[RagSystemRoadmap/DropdownsForGradeTermSubject.md|UI dropdowns]].
*   **Mistake:** Creating overly complex, nested JSON structures that are difficult to parse. **Why it happens:** Trying to capture too much information in a single record. **How to fix it:** Keep the structure flat and simple; use the [[RagSystemRoadmap/BuildUnifiedContext.md|context construction]] phase to combine information from multiple chunks later.

## Examples
*   **Real-world analogy:** A shipping warehouse doesn't just throw items into boxes. They scan each item, assign a unique SKU, and attach a packing slip (metadata) that details the contents, origin warehouse, and destination. This structured package (JSON) can then be efficiently sorted, routed, and tracked throughout the entire logistics system, just like a text chunk in the RAG pipeline.
*   **Code snippet:** This shows a complete, valid structured JSON object ready for the next stage of processing.
    ```json
    {
      "chunk_id": "math_gr8_t1_p15_chunk1",
      "content": "To solve for x in the equation 2x + 5 = 15, you must first isolate the variable by performing inverse operations on both sides.",
      "metadata": {
        "source": "middle_school_math_vol1.pdf",
        "page": 15,
        "subject": "Mathematics",
        "grade": "Grade 8",
        "term": "Term 1"
      }
    }
    ```

## Advanced notes
*   Using a standardized JSON structure is a prerequisite for the [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md|Qdrant upsert operation]], as the vector database expects a consistent payload format that includes the vector, the ID, and this structured metadata.
*   For large-scale systems, consider saving these JSON objects in a **JSONL (JSON Lines)** format, where each line is a valid JSON object, as it is more efficient to stream and process than a single large JSON array.
*   The metadata schema can be extended to include domain-specific fields, such as `difficulty_level` or `curriculum_standard`, to enable even more powerful filtering during [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|retrieval]].

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

