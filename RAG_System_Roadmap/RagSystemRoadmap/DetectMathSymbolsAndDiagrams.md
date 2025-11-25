---
id: rag-system-roadmap-pdf-text-extraction-detect-math-symbols-and-diagrams_2f83fb91
type: leaf
parent: RagSystemRoadmap/PdfTextExtraction.md
children:
prereqs:
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md
see_also:
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/Phase2PreprocessingChunking.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md
  - RagSystemRoadmap/FixedLength400600Tokens.md
summary: This process identifies and preserves mathematical notation and diagrams during text extraction to ensure these critical visual elements are accurately represented for search and retrieval in the RAG system.
model: provider/model
run_id: manual
---

# Detect math symbols and diagrams

## Summary
This process identifies and preserves mathematical notation and diagrams during text extraction to ensure these critical visual elements are accurately represented for search and retrieval in the RAG system.

## Key concepts
- **Mathematical Symbol Detection**: The process of recognizing LaTeX, MathML, or Unicode math symbols within document text, which are essential for scientific and educational content.
- **Diagram Recognition**: Identifying graphical elements like flowcharts, graphs, and geometric figures that convey information visually rather than through plain text.
- **Semantic Preservation**: Maintaining the meaning and structure of mathematical expressions and diagrams so they remain useful after extraction, unlike standard text processing that might corrupt them.
- **OCR Specialization**: Using Optical Character Recognition engines trained on mathematical symbols and diagram components to accurately convert images of equations into searchable text formats.

## Why it matters
- **Educational Integrity**: Math problems and scientific diagrams lose their meaning if symbols are corrupted, making accurate detection crucial for tutoring systems.
- **Search Relevance**: Users searching for "Pythagorean theorem" need to find documents containing "a² + b² = c²" with proper superscripts, not garbled text.
- **Context Preservation**: Diagrams often summarize complex relationships that paragraphs of text would require, making them invaluable for quick understanding.
- **Domain Specificity**: Scientific and technical documents rely heavily on precise notation that standard text extraction would misinterpret or destroy.

## Core steps
- **Configure specialized OCR** to recognize mathematical symbols by using engines like Tesseract with math-trained models, because standard OCR performs poorly on equations.
  ```python
  # Using pytesseract with custom config for math symbols
  custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()[]{}<>+=-\*/^±≈≠≤≥∞∫∑∏√∂∆∇'
  math_text = pytesseract.image_to_string(math_image, config=custom_config)
  ```
- **Extract and tag diagram regions** using computer vision libraries to identify bounding boxes around graphical elements before OCR processing.
- **Convert equations to LaTeX** using dedicated tools like Mathpix or InftyReader, which specialize in translating equation images to machine-readable formats that preserve mathematical meaning.
- **Preserve spatial relationships** in diagrams by storing coordinate data and connection information, ensuring the extracted representation maintains the original visual logic.

## Checks
- **Does the extracted equation maintain proper symbol relationships?**
  - ✔ "E=mc²" remains "E=mc^2" or proper LaTeX
  - ✘ "E=mc2" where superscript is lost
- **Are diagram elements connected logically after extraction?**
  - ✔ Flowchart arrows point between correct steps
  - ✘ Boxes appear as disconnected text blocks
- **Can the system distinguish between regular text and mathematical notation?**
  - ✔ "The area is πr²" identifies "πr²" as math
  - ✘ Entire sentence treated as regular text

## Failure modes
- **Symbol Collapse**: Mathematical operators get converted to plain text equivalents, happening because basic OCR engines don't recognize specialized symbols. Fix by implementing symbol whitelists and math-specific OCR configurations.
- **Diagram Fragmentation**: Complex diagrams get extracted as disconnected text blocks when the system fails to recognize spatial relationships. Fix by using layout analysis algorithms that detect bounding boxes and connection lines.
- **Formatting Loss**: Superscripts, subscripts, and special formatting disappear during extraction because the process normalizes text too aggressively. Fix by implementing format-preserving extraction that detects and marks up positional differences.

## Examples
- **Library Analogy**: Detecting math symbols is like a librarian who can read both regular books and sheet music - they need different skills to properly catalog each type of content, and mixing them up makes both useless.
- **Code Implementation**: 
  ```python
  def extract_math_regions(document_page):
      # Detect potential math areas by symbol density
      math_pattern = r'\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]'
      math_matches = re.findall(math_pattern, document_page.text)
      
      # Also use visual detection for displayed equations
      visual_math_areas = detect_isolated_equations(document_page.image)
      
      return math_matches + visual_math_areas
  ```
  This function uses both textual patterns (LaTeX delimiters) and visual analysis to comprehensively identify mathematical content.

## Advanced notes
- **Train custom ML models** on mathematical documents to improve detection accuracy beyond pre-trained models, particularly for domain-specific notation.
- **Implement fallback strategies** where if mathematical OCR fails, the system preserves the original image region and flags it for [[RagSystemRoadmap/HumanReview.md|human review]] rather than returning corrupted text.
- **Combine multiple approaches** using rule-based pattern matching for known LaTeX, ML-based visual detection for rendered equations, and [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] to retrieve both textual and mathematical concepts.
- **Consider performance trade-offs** between accuracy and speed, as sophisticated math detection can significantly impact processing time during [[RagSystemRoadmap/PdfTextExtraction.md|PDF extraction]].

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

