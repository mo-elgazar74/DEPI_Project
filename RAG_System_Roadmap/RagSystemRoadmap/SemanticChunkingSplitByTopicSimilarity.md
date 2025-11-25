---
id: rag-system-roadmap-chunking-methods-semantic-chunking-split-by-topic-similarity_c47755ca
type: leaf
parent: RagSystemRoadmap/ChunkingMethods.md
children:
prereqs:
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/SentenceBasedUsingSpacy.md
  - RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md
  - RagSystemRoadmap/Phase2PreprocessingChunking.md
  - RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md
see_also:
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: Semantic chunking intelligently splits documents into coherent segments by grouping text with similar topics and meanings together, rather than using arbitrary character counts, which creates more contextually relevant chunks for [[RetrievalPrecisionKRecallK|retrieval systems]].
model: provider/model
run_id: manual
---

# Semantic Chunking (split by topic similarity)

## Summary

Semantic chunking intelligently splits documents into coherent segments by grouping text with similar topics and meanings together, rather than using arbitrary character counts, which creates more contextually relevant chunks for [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval systems]].

## Key concepts

*   **Semantic similarity** measures how closely the meaning of two text pieces align; for example, sentences discussing "photosynthesis" and "chlorophyll" have high semantic similarity because they cover related biological concepts.
*   **Embeddings** are numerical vector representations of text that capture semantic meaning; using a tool like [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|HuggingFace multilingual E5-small]] converts the phrase "Newton's laws" into a dense vector of 384 numbers that positions it near "physics" and "motion" in vector space.
*   **Topic boundaries** are natural transition points in a document where the subject matter shifts, such as a textbook chapter moving from "introduction to algebra" to "solving quadratic equations," which semantic chunking aims to detect.
*   **Cohesive chunks** are the resulting text segments that each focus on a single primary theme, like a chunk containing all sentences about "the water cycle" including evaporation, condensation, and precipitation, making them ideal for [[RagSystemRoadmap/SemanticSearch.md|semantic search]].

## Why it matters

*   It dramatically improves [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval accuracy]] by ensuring each retrieved chunk is a self-contained, topically coherent unit, so when a user asks "How do batteries work?", the system retrieves a complete chunk explaining electrochemical cells rather than a fragment ending mid-sentence.
*   This method preserves complex context that fixed-length splitting might destroy, such as keeping a multi-paragraph mathematical proof intact within one chunk so the logical flow remains unbroken for the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|generator]].
*   It reduces noise in [[RagSystemRoadmap/BuildUnifiedContext.md|unified context]] by minimizing irrelevant information within chunks, preventing a scenario where a chunk about "ancient Egyptian pyramids" also contains unrelated text about "modern solar panels" due to arbitrary splitting.
*   The approach is particularly valuable for educational content where conceptual understanding requires complete explanations, ensuring a student querying "photosynthesis" gets the entire process from light absorption to glucose production in one retrievable unit.

## Core steps

*   **Generate sentence embeddings** to convert each sentence into a numerical vector that represents its meaning, using [[RagSystemRoadmap/EmbeddingGeneration.md|embedding generation]] so that "The mitochondria is the powerhouse of the cell" and "Cellular energy production occurs in mitochondria" produce similar vectors for comparison.
    ```python
    # Using sentence-transformers library
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    sentences = ["First sentence text.", "Second sentence text."]
    sentence_embeddings = model.encode(sentences)
    ```
*   **Calculate similarity matrix** to quantify how semantically related each sentence is to every other sentence, creating a map where high values indicate similar topics and low values signal topic boundaries for chunk separation.
    ```python
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    
    # Calculate similarity between all sentence pairs
    similarity_matrix = cosine_similarity(sentence_embeddings)
    
    # Visualize boundaries where similarity drops significantly
    boundaries = np.where(similarity_matrix.diagonal(-1) < 0.3)[0]
    ```
*   **Identify topic shift points** by detecting significant drops in similarity between consecutive sentences, which naturally segments the document when the discussion moves from "animal habitats" to "plant biology" without requiring predefined chunk sizes.
*   **Form cohesive chunks** by grouping sentences between identified boundaries, ensuring each chunk contains semantically related content about a single theme, like all sentences discussing "Renewable Energy Sources" together for better [[RagSystemRoadmap/ContextConstruction.md|context construction]].

## Checks

*   ✔ Do chunks maintain single-topic focus when reviewed by a human?
    *   ✔ "This entire chunk discusses only the causes of World War I"
    *   ✘ "This chunk starts with World War I causes but ends with modern geopolitics"
*   ✔ Are similar questions retrieving the same high-quality chunks consistently?
    *   ✔ Queries "cell division" and "mitosis process" both retrieve the biology chunk
    *   ✘ "Cell division" retrieves biology while "mitosis" retrieves unrelated mathematics
*   ✔ Do chunk boundaries align with natural document structure?
    *   ✔ Chunk ends when section changes from "Introduction" to "Methods"
    *   ✘ Chunk splits mid-paragraph during explanation of a single concept
*   ✔ Are mathematical proofs and logical arguments preserved intact?
    *   ✔ Complete mathematical induction proof contained within one chunk
    *   ✘ Proof split between chunks, breaking logical flow

## Failure modes

*   **Over-chunking** occurs when similarity thresholds are too sensitive, creating many tiny chunks that fragment coherent topics; fix by adjusting similarity thresholds or implementing minimum chunk size constraints similar to [[RagSystemRoadmap/AdjustChunkSize.md|adjustable chunk size]] parameters.
*   **Under-chunking** happens when similarity thresholds are too lenient, merging distinct topics into oversized chunks that reduce retrieval precision; address by lowering similarity thresholds or adding maximum size limits while [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md|keeping overlap]] for context preservation.
*   **Domain mismatch** arises when general-purpose embeddings fail to recognize specialized topic boundaries in technical content; solve by using [[RagSystemRoadmap/FineTunedEmbeddingsForArabicDomain.md|fine-tuned embeddings]] specifically trained on educational or domain-specific materials.
*   **Computational intensity** can slow processing with large documents due to pairwise sentence comparisons; optimize by preprocessing with [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md|recursive chunking]] first or using [[RagSystemRoadmap/AsyncSearchForSpeed.md|async processing]] for embedding generation.

## Examples

*   **Real-world analogy**: Imagine organizing a bookshelf by subject rather than by arbitrary book size—semantic chunking groups all history books together, all science books together, and all literature together, making it much easier to find all relevant information when you're researching a specific topic.
*   **Code implementation** showing how to detect topic shifts using cosine similarity thresholds:
    ```python
    def semantic_chunking(sentences, embeddings, threshold=0.35):
        chunks = []
        current_chunk = [sentences[0]]
        
        for i in range(1, len(sentences)):
            # Calculate similarity between current and previous sentence
            similarity = cosine_similarity([embeddings[i-1]], [embeddings[i]])[0][0]
            
            if similarity < threshold:
                # Topic shift detected, finalize current chunk
                chunks.append(" ".join(current_chunk))
                current_chunk = [sentences[i]]
            else:
                # Continue current topic
                current_chunk.append(sentences[i])
                
        # Add the final chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))
            
        return chunks
    ```
*   **Educational example**: A biology textbook section might be chunked into "Cell Structure" (membrane, organelles, nucleus), "Cellular Transport" (diffusion, osmosis, active transport), and "Cell Division" (mitosis, meiosis)—each forming a semantically coherent unit for [[RagSystemRoadmap/PickChunksFromMainSubject.md|subject-specific retrieval]].

## Advanced notes

*   Combine with [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] approaches where semantic chunks provide conceptual understanding while keyword matching ensures specific term coverage, creating a robust [[RagSystemRoadmap/RetrieverLlamaindexLangchain.md|retriever system]].
*   Implement dynamic thresholding where similarity boundaries adapt to document type—technical manuals might need higher thresholds (0.5+) while conversational text works with lower values (0.3)—and validate through [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|evaluation scripts]].
*   Use [[RagSystemRoadmap/DominantSubjectFiltering.md|dominant subject filtering]] as a post-processing step to ensure chunks haven't accidentally merged multiple topics, particularly valuable for [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|subject-specific collections]].
*   Consider [[RagSystemRoadmap/AutoSummarization.md|auto-summarization]] for very large semantic chunks to create hierarchical chunking where each major topic has both detailed and summarized versions available for different query types.

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

