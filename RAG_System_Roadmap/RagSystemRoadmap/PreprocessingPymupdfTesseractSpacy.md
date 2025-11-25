---
id: rag-system-roadmap-preprocessing-pymupdf-tesseract-spacy_90cbe4ac
type: leaf
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
prereqs:
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/EmbeddingGeneration.md
see_also:
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/Output.md
  - RagSystemRoadmap/QdrantSetup.md
  - RagSystemRoadmap/Goal.md
  - RagSystemRoadmap/SemanticSearch.md
summary: This phase transforms raw documents into clean, structured text by extracting content from PDFs, applying OCR for scanned pages, and using linguistic analysis to prepare data for semantic search and retrieval.
model: provider/model
run_id: manual
---

# **Preprocessing:** PyMuPDF, Tesseract, spaCy

## Summary
This phase transforms raw documents into clean, structured text by extracting content from PDFs, applying OCR for scanned pages, and using linguistic analysis to prepare data for semantic search and retrieval.

## Key concepts
*   **Text Extraction** is the process of pulling raw text from digital documents. For example, using PyMuPDF to get text from a textbook PDF where the text is already selectable.
    ```python
    import fitz  # PyMuPDF
    doc = fitz.open("digital_book.pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    ```
*   **Optical Character Recognition (OCR)** is a technology that converts images of text into machine-encoded text. For instance, using Tesseract on a scanned PDF page is like using a digital typewriter that can read a photograph of a page and type out the words it sees.
*   **Linguistic Processing** involves using a language model to understand text structure, like identifying sentence boundaries. Think of spaCy as a grammar teacher who can automatically find where each sentence in a paragraph begins and ends, which is crucial for clean [[RagSystemRoadmap/ChunkingMethods.md]].

## Why it matters
*   **Garbage In, Garbage Out:** If the extracted text is messy or incorrect, the [[RagSystemRoadmap/EmbeddingGeneration.md]] will create poor vector representations, leading to bad [[RagSystemRoadmap/SemanticSearch.md]] results.
*   **Enables Semantic Understanding:** Clean, structured text allows the EmbeddingHuggingfaceIntfloatMultilingualE5Small model to generate high-quality vectors that capture the true meaning, making [[RagSystemRoadmap/QueryQdrantForTopKChunks.md]] more accurate.
*   **Foundation for Chunking:** Accurate sentence and word boundaries from spaCy are essential for effective [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]] or [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]], which directly impacts [[RagSystemRoadmap/ContextConstruction.md]].

## Core steps
*   **Action:** Extract raw text from PDFs using PyMuPDF. **Reason:** This is the fastest method for digital PDFs and preserves text structure. **Example:**
    ```python
    # Primary extraction with PyMuPDF
    with fitz.open("document.pdf") as doc:
        raw_text = "\n".join([page.get_text() for page in doc])
    ```
*   **Action:** Implement an OCR fallback for pages with no extractable text. **Reason:** Scanned PDFs are images and PyMuPDF cannot read them. **Example:** Check if a page's text is empty, then use Tesseract.
    ```python
    # [[RagSystemRoadmap/OcrFallbackForImagePages.md]]
    if not page.get_text().strip():
        pix = page.get_pixmap()
        img_data = pix.tobytes("png")
        ocr_text = pytesseract.image_to_string(Image.open(io.BytesIO(img_data)))
    ```
*   **Action:** Clean the extracted text by normalizing digits and removing noise. **Reason:** Inconsistent characters (e.g., '1' vs 'l') confuse the embedding model. **Example:** Use regex to standardize numbers and remove extra whitespace as part of [[RagSystemRoadmap/TextCleaning.md]].
    ```python
    # [[RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md]]
    import re
    cleaned_text = re.sub(r'\s+', ' ', raw_text)  # Collapse multiple spaces
    cleaned_text = re.sub(r'[٠-٩]', lambda x: str(ord(x.group()) - ord('٠')), cleaned_text)  # Normalize Arabic digits
    ```
*   **Action:** Use spaCy to split the clean text into sentences. **Reason:** Sentences are natural semantic units and provide high-quality boundaries for [[RagSystemRoadmap/ChunkingMethods.md]]. **Example:**
    ```python
    # [[RagSystemRoadmap/SentenceBasedUsingSpacy.md]]
    nlp = spacy.load("en_core_web_sm")
    doc = nlp(cleaned_text)
    sentences = [sent.text for sent in doc.sents]
    ```

## Checks
*   **Does text extraction handle both digital and scanned PDFs?**
    *   ✔: A digital PDF returns clean, selectable text via PyMuPDF; a scanned PDF page triggers Tesseract OCR.
    *   ✘: A scanned PDF returns empty strings or the system crashes.
*   **Is the output text clean and free of obvious corruption?**
    *   ✔: "The cat sat on the mat. 2 + 2 = 4."
    *   ✘: "T h e c a t s a t o n t h e m a t . 2 + 2 = 4 ."
*   **Are sentences correctly identified by the linguistic processor?**
    *   ✔: "This is sentence one. This is sentence two." is split into two strings.
    *   ✘: The entire block is one string, or it splits in the middle of a phrase like "Mr. Smith".

## Failure modes
*   **Mistake:** Assuming all PDFs are digital and skipping OCR. **Why it happens:** Development often uses clean, digital test documents. **How to fix it:** Implement a robust [[RagSystemRoadmap/OcrFallbackForImagePages.md]] that checks text length per page and automatically uses Tesseract when needed.
*   **Mistake:** Applying aggressive text cleaning that removes meaningful content. **Why it happens:** Over-zealous regex patterns designed to remove noise can also remove crucial symbols. **How to fix it:** Use [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md]] and test cleaning rules on a diverse document set, especially for educational content containing math.
*   **Mistake:** Using a simple split on periods for sentence segmentation. **Why it happens:** It's a quick, naive implementation. **How to fix it:** Use a proper NLP library like spaCy ([[RagSystemRoadmap/SentenceBasedUsingSpacy.md]]) that understands context, so it doesn't split on abbreviations like "Dr." or "e.g.".

## Examples
*   **Real-World Analogy:** Preprocessing is like preparing ingredients for a master chef (the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md]]). You wouldn't give a chef whole, unwashed vegetables with dirt still on them. Similarly, you extract the "meat" of the text (PyMuPDF), wash and chop it to remove "dirt" like formatting errors (Text Cleaning), and arrange it into usable pieces like diced onions or sliced carrots (spaCy sentences) so the chef can work efficiently.
*   **Code Snippet:** A unified function to handle extraction and OCR.
    ```python
    def extract_page_text(page):
        """Extracts text from a PDF page, using OCR if necessary."""
        # Try direct extraction first
        text = page.get_text()
        if text.strip():
            return text
        else:
            # Fallback to OCR
            return ocr_page_image(page)
    ```

## Advanced notes
*   For complex documents, combine tools: Use PyMuPDF to get text *and* image bounding boxes, then use Tesseract only on image regions to [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md]] for special handling.
*   Consider document language detection before processing to ensure the correct Tesseract language pack and spaCy model are used, aligning with the goal of [[RagSystemRoadmap/SameLanguageAsQuestion.md]].
*   The quality of this phase is critical for downstream [[RagSystemRoadmap/Evaluation.md]] metrics like [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]]; noisy text here will cause poor performance that's hard to diagnose later.

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

