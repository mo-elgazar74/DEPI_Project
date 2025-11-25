---
id: rag-system-roadmap-text-cleaning-normalize-digits-and-remove-noise_977facef
type: leaf
parent: RagSystemRoadmap/TextCleaning.md
children:
prereqs:
  - RagSystemRoadmap/Phase2PreprocessingChunking.md
  - RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
see_also:
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/SentenceBasedUsingSpacy.md
summary: This process standardizes numerical representations and eliminates irrelevant characters from text, ensuring consistent data for downstream tasks like [[EmbeddingGeneration|embedding generation]] and [[SemanticSearch|semantic search]] by converting all digit variations to a single format and stripping non-informative noise.
model: provider/model
run_id: manual
---

# Normalize digits and remove noise

## Summary

This process standardizes numerical representations and eliminates irrelevant characters from text, ensuring consistent data for downstream tasks like [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]] and [[RagSystemRoadmap/SemanticSearch.md|semantic search]] by converting all digit variations to a single format and stripping non-informative noise.

## Key concepts

*   **Digit Normalization** is the process of converting all numerical characters and their textual representations into a single, consistent format, which prevents the same numerical concept from being treated as different pieces of information.
    *   *Example*: The numbers "٤" (Arabic-Indic), "四" (Chinese), and "4" (Western) are all converted to the standard digit "4".
*   **Noise Removal** involves stripping out characters that do not contribute to the semantic meaning of the text, such as extra whitespace, control characters, or random punctuation, which can interfere with text processing.
    *   *Analogy*: It's like cleaning dust and static from an old audio recording so you can hear the music clearly; here, you're cleaning the text so the AI can understand the core meaning.

## Why it matters

*   **Improves Embedding Quality**: [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|Embedding models]] convert text into numerical vectors; consistent input text leads to more accurate and reliable vector representations, which is critical for [[RagSystemRoadmap/BuildFastSemanticSearchDatabase.md|building a fast semantic search database]].
    *   *Example*: Without normalization, the queries "lesson 5" and "lesson five" would generate different vectors and might not match the same relevant document chunk, reducing [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval precision]].
*   **Reduces Data Sparsity**: By representing numbers consistently, you reduce the number of unique tokens the system must learn, making the model's job easier and more efficient.
    *   *Code Snippet*: A model seeing "2nd", "second", and "2" as different tokens has a harder time than if they are all normalized to "2".
*   **Enhances System Robustness**: It prepares clean, uniform text for subsequent steps like [[RagSystemRoadmap/ChunkingMethods.md|chunking]] and [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|vector metadata]] creation, leading to a more reliable [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]] overall.

## Core steps

*   **Convert all digit characters to a single script (e.g., Western digits 0-9)** to ensure numerical consistency across different languages and sources, which is especially important for a [[RagSystemRoadmap/ToolHuggingfaceIntfloatMultilingualE5Small.md|multilingual embedding model]].
    *   *Example*: Using Python's `unicodedata` library: `normalized_text = ''.join([unicodedata.numeric(char) if unicodedata.category(char) == 'Nd' else char for char in text])` would convert digit characters to their numeric equivalents.
*   **Remove or standardize non-essential punctuation and special characters** to eliminate noise that doesn't carry semantic weight, preventing these characters from distorting the semantic meaning captured during [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]].
    *   *Example*: Using a regular expression to keep only alphanumeric characters and basic punctuation: `import re; clean_text = re.sub(r'[^\w\s.,!?]', '', text)`.
*   **Collapse multiple whitespace characters into a single space** to maintain word separation while removing inconsistent spacing introduced during [[RagSystemRoadmap/PdfTextExtraction.md|PDF text extraction]] or [[RagSystemRoadmap/OcrFallbackForImagePages.md|OCR processing]].
    *   *Example*: `clean_text = ' '.join(text.split())` is a simple Python idiom that efficiently handles this.

## Checks

*   **Does the text "I have ２ apples and five oranges" become "I have 2 apples and 5 oranges"?**
    *   ✔ **Yes, if** both full-width digits ("２") and written numbers ("five") are normalized.
    *   ✘ **No, if** only simple digit conversion is applied, leaving "five" as text.
*   **After processing, does a sentence retain its core words and basic punctuation like periods and question marks?**
    *   ✔ **Yes, if** the cleaning process is targeted and preserves sentence structure.
    *   ✘ **No, if** the process is too aggressive and strips out all punctuation, turning "What is 2+2?" into "What is 22".
*   **Is whitespace uniform, with no random tabs or consecutive spaces?**
    *   ✔ **Yes, if** a whitespace collapsing step is included in the pipeline.
    *   ✘ **No, if** raw, unprocessed text from OCR is passed directly to the [[RagSystemRoadmap/ChunkingRegexRecursiveSplitter.md|chunking]] step.

## Failure modes

*   **Over-cleaning and removing meaningful symbols**: This mistake happens when the noise removal rules are too broad and strip out semantically important characters like mathematical operators or currency symbols.
    *   *How to fix it*: Use an allowlist of safe characters or implement a rule to [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md|preserve mathematical and diagram markers]] specifically.
*   **Failing to normalize written numbers (e.g., "ten")**: This occurs if the normalization process only handles digit characters and ignores number words, creating an inconsistency between numeric and textual representations.
    *   *How to fix it*: Extend the normalization logic to include a library for converting number words to digits (e.g., `word2number` for Python) for a more thorough cleanup.
*   **Introducing errors during whitespace removal in structured text**: This pitfall arises when collapsing whitespace in pre-formatted text (e.g., code blocks or tables), which can destroy the intended structure and meaning.
    *   *How to fix it*: Apply cleaning logic selectively, or after [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md|splitting by headers and smaller units]], to avoid processing code blocks and structured data elements.

## Examples

*   **Real-World Analogy**: Imagine a librarian organizing books. If some books have the publication date written as "1999," others as "nineteen ninety-nine," and a few with a typo like "1999!!", the librarian would standardize all these to "1999" before filing them away. This ensures that anyone searching for books from that year finds them all, regardless of how the date was originally written. This is exactly what digit normalization and noise removal do for text in a [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]].
*   **Code Snippet**: Here is a simplified Python function demonstrating the core concepts.
    ````python
    import re
    import unicodedata

    def clean_text(text):
        # Step 1: Normalize unicode digits to Western 0-9
        text = ''.join(char if not unicodedata.category(char) == 'Nd' else str(unicodedata.digit(char)) for char in text)
        
        # Step 2: Remove excessive or special characters (keep basic punctuation)
        text = re.sub(r'[^\w\s.,!?]', '', text)
        
        # Step 3: Collapse multiple whitespaces
        text = ' '.join(text.split())
        
        return text

    # Example usage
    dirty_text = "This  costs ５０ dollars!!!  \t  So expensive."
    clean_text = clean_text(dirty_text)
    print(clean_text)  # Output: "This costs 50 dollars!!! So expensive."
    ````

## Advanced notes

*   For highly specialized domains, consider creating custom normalization rules; for example, in a financial system, you might want to preserve and standardize currency symbols instead of removing them.
*   The effectiveness of your text cleaning pipeline should be continuously validated through the [[RagSystemRoadmap/Evaluation.md|evaluation]] phase, using [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|custom scripts]] to track if cleaner text leads to better [[RagSystemRoadmap/GenerationFactualityFluency.md|generation factuality and fluency]].
*   While this step is part of [[RagSystemRoadmap/TextCleaning.md|general text cleaning]], it occurs early in the pipeline, specifically within [[RagSystemRoadmap/Phase2PreprocessingChunking.md|Phase 2: Preprocessing & Chunking]], right after [[RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md|text extraction]] and before any [[RagSystemRoadmap/ChunkingMethods.md|chunking methods]] are applied.

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

