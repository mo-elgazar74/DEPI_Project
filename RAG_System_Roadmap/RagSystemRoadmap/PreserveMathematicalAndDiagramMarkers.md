---
id: rag-system-roadmap-text-cleaning-preserve-mathematical-and-diagram-markers_ca4c2573
type: leaf
parent: RagSystemRoadmap/TextCleaning.md
children:
prereqs:
  - RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
see_also:
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/Phase2PreprocessingChunking.md
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/SentenceBasedUsingSpacy.md
summary: This process identifies and protects mathematical equations, chemical formulas, and diagram markers during text cleaning to prevent them from being corrupted or removed, ensuring these critical educational elements remain intact for accurate retrieval and generation.
model: provider/model
run_id: manual
---

# Preserve mathematical and diagram markers

## Summary

This process identifies and protects mathematical equations, chemical formulas, and diagram markers during text cleaning to prevent them from being corrupted or removed, ensuring these critical educational elements remain intact for accurate retrieval and generation.

## Key concepts

*   **Mathematical markers** are specific patterns like LaTeX delimiters (`$$...$$`, `\(...\)`) or inline code blocks that denote equations, which are essential for subjects like physics and mathematics. For example, the quadratic formula `$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$` must be preserved exactly as written to be meaningful.
*   **Diagram markers** are textual placeholders or descriptions, often found in code blocks or specific brackets, that indicate where a visual element like a flowchart or graph exists, such as `[DIAGRAM: Water Cycle Process]`. Think of these as labels on a museum exhibit that tell you what the accompanying picture represents.
*   **Pattern recognition** involves using regular expressions (regex) to scan text for known markers before applying general cleaning rules, acting like a security guard who escorts VIPs through a construction zone to ensure they aren't accidentally affected by the cleanup work.
    ```python
    # Example regex pattern to match common LaTeX equation delimiters
    latex_pattern = r'\$\$.*?\$\$|\\\(.*?\\\)'
    ```

## Why it matters

*   **Preserves semantic meaning**: Mathematical equations and diagrams convey core concepts in STEM subjects; altering or removing them is like erasing the answer key from a textbook, rendering the content incomplete and potentially misleading for the [[RagSystemRoadmap/BuildUnifiedContext.md|BuildUnifiedContext]] process.
*   **Enables accurate retrieval**: If an equation is corrupted during cleaning, a subsequent query for that specific formula will fail to find it in the [[RagSystemRoadmap/Phase4VectorDatabaseLayer.md|vector database]], leading to a failed search similar to looking for a person whose name was misspelled in a directory.
*   **Maintains answer quality**: The [[RagSystemRoadmap/Phase6GenerationLayer.md|Generation Layer]] relies on clean, precise context; providing it with garbled equations guarantees factually incorrect or nonsensical answers, especially when using the [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|Ali5 educational system prompt]].

## Core steps

*   **Action**: Define regex patterns to identify mathematical notation (LaTeX, ASCII math) and diagram markers. **Reason**: This creates a "protected list" so the cleaning process knows which text segments to skip. **Example**:
    ```python
    protected_patterns = [
        r'\$\$.*?\$\$',          # Block LaTeX equations
        r'\\\(.*?\\\)',          # Inline LaTeX equations
        r'```math.*?```',        # Code block math
        r'\[DIAGRAM:.*?\]',      # Diagram markers
    ]
    ```
*   **Action**: Scan the input text and temporarily replace protected segments with unique placeholder tokens. **Reason**: This shields the sensitive content from aggressive text cleaning rules like lowercase conversion or punctuation removal. **Example**: The equation `$$E = mc^2$$` might be replaced with a token like `<<MATH_PLACEHOLDER_1>>` during the main [[RagSystemRoadmap/TextCleaning.md|Text Cleaning]] phase.
*   **Action**: After general cleaning, restore the original protected content from the placeholders. **Reason**: This returns the precise mathematical and diagram information to the cleaned text, making it ready for [[RagSystemRoadmap/ChunkingMethods.md|chunking]] and [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]]. **Example**: The token `<<MATH_PLACEHOLDER_1>>` is swapped back to `$$E = mc^2$$` in the final output.

## Checks

*   Does a simple LaTeX equation remain perfectly intact after the cleaning process?
    *   ✔ `$$\frac{a}{b}$$` → `$$\frac{a}{b}$$`
    *   ✘ `$$\frac{a}{b}$$` → `frac a b` (Delimiters and syntax lost)
*   Is a diagram marker preserved and still easily identifiable?
    *   ✔ `[DIAGRAM: Photosynthesis]` → `[DIAGRAM: Photosynthesis]`
    *   ✘ `[DIAGRAM: Photosynthesis]` → `diagram photosynthesis` (Structure and casing lost)
*   Does a chemical formula written with subscripts (e.g., `H_2O`) retain its formatting if it was within a protected block?
    *   ✔ `$$H_2O$$` → `$$H_2O$$`
    *   ✘ `$$H_2O$$` → `$$h2o$$` (Case and subscript lost)

## Failure modes

*   **Mistake**: Using overly greedy regex patterns that capture too much text. **Why it happens**: A pattern like `r'\$.*?\$'` might match text between dollar signs used for currency, not just equations. **How to fix it**: Craft more precise patterns that account for common delimiters and use multiline flags cautiously; test patterns on a diverse dataset during [[RagSystemRoadmap/Phase7EvaluationOptimization.md|evaluation]].
*   **Mistake**: Applying Unicode normalization or lowercase conversion to protected content. **Why it happens**: The placeholder swap occurs after these cleaning steps, but if the protection step is placed incorrectly in the pipeline, the content is exposed. **How to fix it**: Ensure the "protect-and-restore" logic wraps the core cleaning functions in the [[RagSystemRoadmap/PreprocessingPymupdfTesseractSpacy.md|preprocessing]] pipeline.
*   **Mistake**: Failing to handle nested or complex structures, breaking the content. **Why it happens**: A regex pattern might stop at the first closing delimiter, truncating a complex, multi-line equation. **How to fix it**: Implement a more robust parsing strategy for complex cases or use dedicated libraries for [[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md|detecting math symbols]] in the [[RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md|data ingestion]] phase.

## Examples

*   **Real-world analogy**: Imagine you're editing a document with a highlighter. Before using white-out to clean up smudges, you carefully highlight all the important formulas and diagrams. You then apply the white-out everywhere else. Finally, you remove the highlighter, leaving the critical information perfectly preserved and the rest of the page clean. The highlighting is the placeholder swap, and the white-out is the general text cleaning.
*   **Code snippet**: Here is a simplified Python function demonstrating the protect-and-restore logic.
    ```python
    import re

    def clean_text_preserve_special_content(text):
        # 1. Define patterns and create placeholders
        protected_patterns = [
            (r'\$\$.*?\$\$', 'MATH_BLOCK'),
            (r'\\\(.*?\\\)', 'MATH_INLINE'),
            (r'\[DIAGRAM:.*?\]', 'DIAGRAM'),
        ]
        placeholder_map = {}
        protected_text = text
        
        for i, (pattern, prefix) in enumerate(protected_patterns):
            for match in re.finditer(pattern, protected_text, re.DOTALL):
                placeholder = f"<<{prefix}_{i}_{len(placeholder_map)}>>"
                placeholder_map[placeholder] = match.group(0)
                protected_text = protected_text.replace(match.group(0), placeholder, 1)

        # 2. Apply general text cleaning to the protected_text
        # (e.g., lowercase, remove extra whitespace, but NOT on placeholders)
        cleaned_text = protected_text.lower()  # Placeholders are safe

        # 3. Restore the original protected content
        for placeholder, original_content in placeholder_map.items():
            cleaned_text = cleaned_text.replace(placeholder, original_content)

        return cleaned_text

    # Example usage
    dirty_text = "The formula $$E = mc^2$$ is famous. See [DIAGRAM: Space-Time Curvature]."
    clean_text = clean_text_preserve_special_content(dirty_text)
    print(clean_text)
    # Output: "the formula $$E = mc^2$$ is famous. see [DIAGRAM: Space-Time Curvature]."
    # The equation and diagram are preserved, while the rest is lowercased.
    ```

## Advanced notes

*   For highly technical corpora, consider integrating a dedicated math OCR or LaTeX parser during the initial [[RagSystemRoadmap/PdfTextExtraction.md|PDF text extraction]] to improve the detection accuracy of mathematical regions before they enter the cleaning pipeline.
*   The choice of placeholder tokens is important; they must be unique strings that cannot possibly appear in the genuine text to avoid accidental collisions during the restore phase, which could corrupt the final output.
*   In a [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] system, preserving these markers not only helps [[RagSystemRoadmap/SemanticSearch.md|semantic search]] but can also boost keyword-based (BM25) retrieval for queries like "equation for relativity" if the exact marker `$$E = mc^2$$` is present in the indexed text.

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

