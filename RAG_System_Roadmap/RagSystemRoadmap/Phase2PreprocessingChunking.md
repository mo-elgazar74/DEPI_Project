---
id: rag-system-roadmap-pdf-text-extraction-phase-2-preprocessing-chunking_5380e6d1
type: leaf
parent: RagSystemRoadmap/PdfTextExtraction.md
children:
prereqs:
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md
  - RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/KeepOverlapOf50100Tokens.md
see_also:
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
  - RagSystemRoadmap/PdfTextExtraction.md
summary: This phase transforms raw extracted text into clean, structured chunks optimized for semantic search by cleaning noise, normalizing content, and splitting documents into meaningful segments with overlapping context.
model: provider/model
run_id: manual
---

# Phase 2 — Preprocessing & Chunking

## Summary
This phase transforms raw extracted text into clean, structured chunks optimized for semantic search by cleaning noise, normalizing content, and splitting documents into meaningful segments with overlapping context.

## Key concepts
- **Text cleaning**: Removing OCR artifacts, normalizing characters, and filtering irrelevant content to improve text quality for downstream processing.
  - *Example*: Converting "thé quïck brôwn fóx" to "the quick brown fox" and removing random symbols like "###" that don't contribute meaning.

- **Chunking**: Breaking large documents into smaller, semantically coherent pieces that can be efficiently processed by embedding models.
  - *Example*: Splitting a 50-page textbook into 200-300 word paragraphs that each cover a complete subtopic or concept.

- **Overlap**: Maintaining context continuity between chunks by repeating small portions of text (50-100 tokens) at chunk boundaries.
  - *Example*: If one chunk ends with "the mitochondria is the powerhouse" and the next begins with "powerhouse of the cell, containing", the overlapping text preserves the complete thought.

## Why it matters
- Clean text ensures embeddings capture semantic meaning rather than noise, dramatically improving [[RagSystemRoadmap/SemanticSearch.md]] accuracy.
- Proper chunking balances context richness with computational efficiency, preventing information loss from chunks that are too small or irrelevant content from chunks that are too large.
- Overlapping chunks prevent context fragmentation at natural breakpoints, ensuring complete thoughts aren't split across chunk boundaries during [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]].
- Well-structured chunks with metadata enable precise [[RagSystemRoadmap/DisplayCitationsSourcePage.md]] and source tracking throughout the [[RagSystemRoadmap/RagSystemRoadmap.md]].

## Core steps
- **Clean extracted text** using [[RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md]] to remove OCR artifacts, normalize Unicode characters, and filter irrelevant markup that would confuse embedding models.
  - *Example*: Using Python's `unicodedata.normalize('NFKD', text)` to convert "café" to "cafe" and regex to remove page numbers like "Page 23 of 105".

- **Apply [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md]]** to maintain scientific and technical content integrity, especially important for educational materials where equations and diagrams carry critical information.
  - *Example*: Using special tokens `[MATH]` and `[DIAGRAM]` to mark mathematical expressions like `E=mc²` and diagram references for later reconstruction.

- **Split documents using [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]]** which first divides by major sections (chapters), then subsections, and finally into [[RagSystemRoadmap/FixedLength400600Tokens.md]] chunks that maintain semantic coherence.
  - *Example*: 
  ```python
  from langchain.text_splitter import RecursiveCharacterTextSplitter
  splitter = RecursiveCharacterTextSplitter(
      chunk_size=500,
      chunk_overlap=50,
      separators=["\n\n", "\n", ". ", " ", ""]
  )
  chunks = splitter.split_text(cleaned_text)
  ```

- **Add [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md]]** between chunks to preserve context across boundaries, ensuring no meaningful information gets lost between splits.
  - *Example*: Configuring the text splitter with `chunk_overlap=75` so each chunk shares 75 tokens with its neighbors, maintaining narrative flow.

- **Enrich chunks with [[RagSystemRoadmap/SaveChunkIdPageAndSource.md]]** metadata to enable precise source attribution and filtering during retrieval operations.
  - *Example*: Storing `{"chunk_id": "doc1_chunk23", "source": "biology_textbook", "page": 45, "subject": "cellular_biology"}` with each chunk.

## Checks
- **Are chunks semantically complete?** 
  - ✔ A chunk about photosynthesis includes both the light-dependent and light-independent reactions
  - ✘ A chunk ends mid-sentence: "The process of cellular respiration begins with"

- **Is overlap sufficient but not excessive?**
  - ✔ 50-100 token overlap maintains context without significant redundancy
  - ✘ 300 token overlap duplicates most content, wasting storage and processing

- **Are mathematical expressions preserved?**
  - ✔ `[MATH]E=mc^2[/MATH]` appears intact in physics chunks
  - ✘ "E=mc2" appears as plain text without special markers

- **Can you trace any chunk back to its source?**
  - ✔ Metadata shows chunk came from "Grade10_Biology.pdf page 23"
  - ✘ Only generic "science_text" appears in source field

## Failure modes
- **Chunking at arbitrary character counts** instead of semantic boundaries happens when using simple split-by-length without considering content structure, resulting in fragmented ideas that hurt [[RagSystemRoadmap/GenerationFactualityFluency.md]].
  - *Fix*: Use [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]] or [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] that respect natural document structure.

- **Losing mathematical and technical content** occurs when cleaning processes are too aggressive and treat equations as noise rather than meaningful content.
  - *Fix*: Implement [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md]] early and use [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md]] to protect technical content through processing pipeline.

- **Insufficient chunk overlap** causes context fragmentation where related concepts are split across chunks without connection, reducing retrieval accuracy in [[RagSystemRoadmap/QueryQdrantForTopKChunks.md]].
  - *Fix*: Increase [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md]] to 75-100 tokens and verify overlap covers complete sentences or logical transitions.

## Examples
- **Real-world analogy**: Think of chunking like cutting a newspaper into articles—you wouldn't cut mid-sentence between "The president announced" and "new economic policies today," but you might include the headline and first paragraph of the next article if they're related, similar to how [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md]] works.

- **Code example showing complete preprocessing pipeline**:
```python
def process_document(raw_text, source_metadata):
    # Clean text
    cleaned = clean_ocr_artifacts(raw_text)
    cleaned = normalize_unicode(cleaned)
    
    # Preserve technical content
    marked_text = mark_technical_content(cleaned)
    
    # Chunk with overlap
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=75,
        separators=["\n\nChapter", "\n\n", "\n", ". ", "! ", "? ", " "]
    )
    chunks = splitter.split_text(marked_text)
    
    # Add metadata
    chunk_objects = []
    for i, chunk in enumerate(chunks):
        chunk_objects.append({
            "id": f"{source_metadata['doc_id']}_chunk{i}",
            "content": chunk,
            "source": source_metadata['source'],
            "page": extract_page_number(chunk, source_metadata),
            "subject": source_metadata.get('subject', 'general')
        })
    
    return chunk_objects
```

## Advanced notes
- **Semantic chunking** using [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] analyzes content cohesion and splits where topic shifts occur naturally, often producing more meaningful chunks than fixed-length approaches for complex documents.
- **Adaptive chunk sizes** can optimize for different content types—smaller chunks (200-300 tokens) for dense technical content, larger chunks (600-800 tokens) for narrative text, adjustable via [[RagSystemRoadmap/AdjustChunkSize.md]] based on document analysis.
- **Language-specific chunking** using [[RagSystemRoadmap/SentenceBasedUsingSpacy.md]] provides better results for some languages where sentence boundaries are clearer indicators of semantic units than character counts.
- **Progressive chunking strategies** can apply different methods hierarchically—semantic chunking for major sections, then fixed-length within sections—balancing semantic coherence with practical constraints for [[RagSystemRoadmap/EmbeddingGeneration.md]].

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

