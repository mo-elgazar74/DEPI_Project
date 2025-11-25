---
id: rag-system-roadmap-pdf-text-extraction_a9916402
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/Phase2PreprocessingChunking.md
prereqs:
see_also:
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/EmbeddingGeneration.md
summary: 
model: provider/model
run_id: manual
---

# **PDF & Text Extraction**

## Summary
*   **Core Goal:** Convert physical books, digital PDFs, and scanned images into clean, machine-readable text, forming the raw material for your entire [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]].
*   **The Challenge:** PDFs are presentation formats, not data formats; text can be selectable, hidden in images, or contain complex elements like math symbols.
*   **The Process:** A multi-stage pipeline that extracts raw text, uses [[RagSystemRoadmap/OcrFallbackForImagePages.md|OCR fallback]] for image-based pages, detects special elements like [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md|math symbols and diagrams]], and finally packages everything into [[RagSystemRoadmap/SaveStructuredJsonWithMetadata.md|structured JSON with metadata]] for the next phase, [[RagSystemRoadmap/Phase2PreprocessingChunking.md|Preprocessing & Chunking]].

## When to use
*   **Starting a new RAG project:** This is always the first step ([[RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md|Phase 1 — Data/Knowledge Ingestion]]) to populate your knowledge base.
*   **Adding new documents:** Whenever you acquire new books, reports, or manuals you want the system to know about.
*   **Encountering a "bad" PDF:** When your current extractor returns little or no text, indicating a scanned or image-heavy document.
*   **Working with academic or technical content:** When your source material contains mathematical notation or diagrams that must be preserved for accurate Q&A.

## Decision points
*   **Digital PDF vs. Scanned PDF:** Use [[RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md|PyMuPDF]] for direct text extraction from digital PDFs; use [[RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md|Tesseract]] via [[RagSystemRoadmap/OcrFallbackForImagePages.md|OCR fallback]] for scanned PDFs or image pages.
*   **Text Cleanliness vs. Completeness:** A simple extractor is fast and clean, but OCR is slower and can introduce noise, yet it's the only way to get text from scans.
*   **Handling Complex Content:** For general text, standard extraction is sufficient. For scientific papers, you must activate [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md|detection for math symbols and diagrams]] to preserve critical information.
*   **Structuring Output:** Decide what metadata (page numbers, source file, subject) to include in the [[RagSystemRoadmap/SaveStructuredJsonWithMetadata.md|structured JSON]] to aid future retrieval and filtering.

## Examples
*   **Simple Analogy:** Think of this phase as a librarian digitizing a new book. They don't just take a picture of the pages (useless for searching); they type out all the text and make note of the page numbers and any important pictures or charts.
*   **Technical Workflow:**
    1.  A PDF is loaded.
    2.  [[RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md|PyMuPDF]] tries to extract selectable text from page 1 → Success! Text is stored.
    3.  On page 2, PyMuPDF finds no text → The system triggers [[RagSystemRoadmap/OcrFallbackForImagePages.md|OCR fallback]] using [[RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md|Tesseract]].
    4.  Tesseract analyzes the page image and converts it to text.
    5.  A separate process scans for LaTeX-style patterns (`$E=mc^2$`) to [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md|detect math symbols]].
    6.  All extracted text, its source page, and other data are saved into a [[RagSystemRoadmap/SaveStructuredJsonWithMetadata.md|structured JSON]] object.
*   **Code Snippet (Pseudocode):**
    ````python
    # For each page in a PDF document:
    for page in pdf_document:
        raw_text = pymupdf_extract(page)  # Primary extraction
        
        if not raw_text:  # If primary extraction fails
            raw_text = tesseract_ocr(page)  # OCR fallback
            
        if contains_math(raw_text):
            math_markers = preserve_math(raw_text)  # Detect/preserve math
            
        structured_data = {
            "text": clean_text(raw_text),
            "metadata": {
                "page_number": page.number,
                "source": pdf_document.name,
                "contains_math": bool(math_markers)
            }
        }
        save_as_json(structured_data)
    ````

## Key Takeaways
*   **Garbage In, Garbage Out:** The quality of your final RAG answers is directly limited by the quality of text extracted here.
*   **Hybrid Extraction is Essential:** Relying on a single method will fail; a robust system seamlessly combines direct extraction and OCR.
*   **Metadata is a Future-Proofing Investment:** The [[RagSystemRoadmap/SaveStructuredJsonWithMetadata.md|metadata]] you add now (e.g., page numbers, source) enables powerful features later, like [[RagSystemRoadmap/DisplayCitationsSourcePage.md|displaying citations]] and [[RagSystemRoadmap/DominantSubjectFiltering.md|subject filtering]].
*   **This is a Preprocessing Step:** The output of this phase is "raw text." It is not yet ready for search; it must first be cleaned and structured in the next phase, [[RagSystemRoadmap/Phase2PreprocessingChunking.md|Preprocessing & Chunking]].

## Children
- [[RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md|Tools: PyMuPDF, Tesseract, spaCy]]
- [[RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md|Extract text from books and scanned PDFs]]
- [[RagSystemRoadmap/OcrFallbackForImagePages.md|OCR fallback for image pages]]
- [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md|Detect math symbols and diagrams]]
- [[RagSystemRoadmap/SaveStructuredJsonWithMetadata.md|Save structured JSON with metadata]]
- [[RagSystemRoadmap/Phase2PreprocessingChunking.md|Phase 2 — Preprocessing & Chunking]]

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

