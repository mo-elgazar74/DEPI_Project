---
id: rag-system-roadmap-chunking-methods-sentence-based-using-spacy_84dde89a
type: leaf
parent: RagSystemRoadmap/ChunkingMethods.md
children:
prereqs:
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md
  - RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md
  - RagSystemRoadmap/KeepOverlapOf50100Tokens.md
see_also:
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
summary: This method splits text into individual sentences using spaCy's linguistic models, creating small, semantically coherent chunks ideal for precise retrieval in educational RAG systems.
model: provider/model
run_id: manual
---

# Sentence-Based (using spaCy)

## Summary
This method splits text into individual sentences using spaCy's linguistic models, creating small, semantically coherent chunks ideal for precise retrieval in educational RAG systems.

## Key concepts
*   **Sentence Segmentation:** The process of identifying sentence boundaries in a block of text. A sentence is a grammatically complete sequence of words expressing a single idea or fact, which spaCy detects using its pre-trained models.
    *   *Example:* The model correctly identifies "Dr. Smith arrived. He gave a lecture." as two separate sentences, despite the period in "Dr.".
*   **Linguistic Model:** A statistical model trained on vast amounts of text to understand language structure, which spaCy uses to perform tasks like sentence segmentation, part-of-speech tagging, and named entity recognition.
    *   *Example:* Using `spacy.load("en_core_web_sm")` loads a small, efficient English model capable of accurate sentence splitting.
*   **Semantic Coherence:** The property of a text chunk containing a single, self-contained idea, which is a natural characteristic of a well-formed sentence and makes it a high-quality unit for retrieval.
    *   *Analogy:* Think of a sentence as a single, self-contained Lego brick of information, whereas a paragraph is a pre-built section; retrieving individual bricks allows for more flexible and precise answer construction.

## Why it matters
*   It produces chunks with high semantic integrity because each sentence typically expresses one complete thought, which improves the precision of [[RagSystemRoadmap/SemanticSearch.md]] by ensuring retrieved information is focused and directly relevant to a user's query.
*   This method is highly effective for question-answering on factual, definition-based content common in educational materials, where answers are often contained within a single sentence, aligning with the goal of [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md]].
*   It avoids the problem of information dilution that can occur in [[RagSystemRoadmap/FixedLength400600Tokens.md]] chunks, where a key fact might be buried in less relevant text, thereby improving [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]].

## Core steps
*   **Load a spaCy language model** to gain access to its sentence segmentation capabilities, as the model's internal knowledge of grammar and punctuation is essential for accurate splitting.
    *   *Example:* `nlp = spacy.load("en_core_web_sm")`
*   **Process the raw text through the spaCy pipeline** to create a `Doc` object, which is a container for accessing linguistic annotations like sentence boundaries.
    *   *Example:* `doc = nlp("First sentence. Second sentence! Is this the third?")`
*   **Iterate over the `doc.sents` generator** to extract each identified sentence as a string, which becomes an individual chunk ready for the next stage of [[RagSystemRoadmap/EmbeddingGeneration.md]].
    *   *Example:*
        ````python
        chunks = []
        for sent in doc.sents:
            chunk_text = sent.text.strip()
            if chunk_text:  # Ensure it's not an empty string
                chunks.append(chunk_text)
        ````

## Checks
*   **Does the splitter correctly handle abbreviations like "Dr." or "i.e." without prematurely ending a sentence?**
    *   ✔ "Dr. Johnson will see you now. Please wait here." → 2 chunks.
    *   ✘ "Dr. Johnson will see you now. Please wait here." → 3 chunks (incorrectly splitting after "Dr").
*   **Are sentences that end with different punctuation (?, !) correctly identified and split?**
    *   ✔ "What time is it? It is noon." → 2 chunks.
    *   ✘ "What time is it? It is noon." → 1 chunk.
*   **Does the output preserve all original text, including mathematical symbols or diagram markers that were part of the [[RagSystemRoadmap/TextCleaning.md]] phase?**
    *   ✔ "The area of a circle is πr². This is a constant." → 2 chunks, with "πr²" intact.
    *   ✘ "The area of a circle is πr². This is a constant." → 2 chunks, but "πr²" is corrupted.

## Failure modes
*   **Mistake:** Using a generic model for highly technical or non-standard text, causing poor sentence segmentation.
    *   *Why it happens:* Standard models like `en_core_web_sm` are trained on general web text and may fail on domain-specific literature with unique sentence structures.
    *   *How to fix it:* Explore fine-tuning a spaCy model on your specific corpus or using a rule-based fallback with [[RagSystemRoadmap/ChunkingRegexRecursiveSplitter.md]] for problematic sections.
*   **Mistake:** Creating chunks that are too small to provide sufficient context for the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md]], leading to fragmented or incoherent answers.
    *   *Why it happens:* A single sentence might lack the surrounding context needed to fully understand a pronoun reference or a complex concept.
    *   *How to fix it:* Implement a post-processing step to merge very short, consecutive sentences, or switch to a method like [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]] that groups related sentences under a common heading.
*   **Mistake:** Failing to account for lists or bullet points, which are often not properly segmented into sentences by NLP models.
    *   *Why it happens:* List items frequently lack terminal punctuation, so spaCy may treat an entire list as one long "sentence."
    *   *How to fix it:* Pre-process the text to detect list structures (e.g., lines starting with `-` or `*`) and split them into individual chunks before applying sentence segmentation to the remaining prose.

## Examples
*   **Real-World Analogy:** Imagine a cookbook where each step in a recipe is written as a single sentence. "Cream the butter and sugar." is one step. "Add the eggs one at a time." is another. Using sentence-based chunking is like indexing each of these steps individually, so when a user asks "How do I incorporate eggs?", the system can instantly retrieve the precise sentence containing that instruction, rather than the entire paragraph for the recipe.
*   **Code Snippet:** The following Python code demonstrates a basic implementation of sentence-based chunking with spaCy, including saving source metadata as required by [[RagSystemRoadmap/SaveChunkIdPageAndSource.md]].
    ````python
    import spacy

    # Load the small English model
    nlp = spacy.load("en_core_web_sm")

    def sentence_chunking(text, source_metadata):
        """Splits text into sentences and attaches metadata."""
        doc = nlp(text)
        chunks_with_metadata = []
        for i, sent in enumerate(doc.sents):
            chunk_data = {
                "chunk_id": f"{source_metadata['doc_id']}_sent_{i}",
                "text": sent.text.strip(),
                "source_page": source_metadata['page'],
                "subject": source_metadata.get('subject', 'General') # For [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md]]
            }
            chunks_with_metadata.append(chunk_data)
        return chunks_with_metadata

    # Example usage
    sample_text = "Photosynthesis is the process used by plants. It converts light energy into chemical energy. This energy is stored as sugar."
    metadata = {"doc_id": "bio_101", "page": 42, "subject": "Biology"}
    chunks = sentence_chunking(sample_text, metadata)
    ````

## Advanced notes
*   For multilingual educational content, ensure you use a corresponding multilingual spaCy model (e.g., `xx_sent_ud_sm`) to maintain segmentation accuracy across languages, which is critical for systems that must provide answers in the [[RagSystemRoadmap/SameLanguageAsQuestion.md]].
*   While sentence chunks are excellent for fact retrieval, they can be suboptimal for queries requiring broader conceptual understanding; in such cases, consider dynamically merging adjacent sentence chunks during the [[RagSystemRoadmap/ContextConstruction.md]] phase based on query complexity.
*   The performance and accuracy of this method are directly tied to the quality of the source text from [[RagSystemRoadmap/PdfTextExtraction.md]]; OCR errors or poor formatting can significantly degrade spaCy's ability to identify correct sentence boundaries.

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

