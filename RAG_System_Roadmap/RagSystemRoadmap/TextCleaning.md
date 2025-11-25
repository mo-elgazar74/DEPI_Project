---
id: rag-system-roadmap-text-cleaning_99345900
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md
  - RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md
prereqs:
see_also:
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/EmbeddingGeneration.md
summary: 
model: provider/model
run_id: manual
---

# **Text Cleaning**

## Summary
*   **Core purpose:** Prepares raw text for downstream RAG processes like [[RagSystemRoadmap/EmbeddingGeneration.md]] and [[RagSystemRoadmap/SemanticSearch.md]] by removing inconsistencies and irrelevant data.
*   **Key trade-off:** Balancing the removal of "noise" (e.g., random punctuation, extra whitespace) with the preservation of "signal" (e.g., [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md|mathematical notation]]).
*   **Analogy:** Like washing vegetables before cooking; you remove dirt but keep the nutritious parts intact.

## When to use
*   **Always:** As the first step in [[RagSystemRoadmap/Phase2PreprocessingChunking.md]], immediately after [[RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md]] or [[RagSystemRoadmap/PdfTextExtraction.md]].
*   **Crucial for multilingual text:** Especially when using a general-purpose embedding model like [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md]] to ensure consistent tokenization.
*   **Before any [[RagSystemRoadmap/ChunkingMethods.md]]:** Clean text first, then chunk; dirty text leads to poorly formed chunks that hurt retrieval accuracy.

## Decision points
*   **Handling numbers:** Use [[RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md]] for general text (e.g., converting "⅕" to "0.2"), but disable it for scientific/technical documents where digit precision is critical.
*   **Technical vs. General Content:** In educational material, prioritize [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md]]; for news articles or web content, aggressive noise removal is often safer.
*   **Downstream model sensitivity:** If your [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md]] is robust, you can be less aggressive; if using a smaller model, stricter cleaning prevents garbage-in-garbage-out.

## Examples
*   **Simple:** Cleaning an address: "123 Main St., Apt. #4B" becomes "123 main st apt 4b" for consistent search, but you would *not* apply this to an equation like "E=mc²".
*   **Technical:** A raw text snippet from OCR: `"Th3 qu1ck br0wn fox jumps ov3r th3 l4zy d0g."` After [[RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md]], it becomes: `"the quick brown fox jumps over the lazy dog."` This ensures the [[RagSystemRoadmap/SemanticSearch.md]] for "canine" can successfully match "dog".

## Key Takeaways
*   **Not one-size-fits-all:** The optimal cleaning pipeline depends heavily on your data source (e.g., [[RagSystemRoadmap/PreprocessingPymupdfTesseractSpacy.md]] output vs. clean HTML).
*   **Preservation over deletion:** It's easier to remove noise later than to recover accidentally deleted critical information like mathematical symbols.
*   **Directly impacts [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]]:** Inconsistent number formatting is a major cause of missed retrievals; clean text leads to higher quality [[RagSystemRoadmap/EmbeddingGeneration.md]] and better final answers.

## Children
- [[RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md|Normalize digits and remove noise]]
- [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md|Preserve mathematical and diagram markers]]

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

