---
id: rag-system-roadmap-chunking-methods-recursive-chunking-split-by-headers-smaller-units_bbe798bc
type: leaf
parent: RagSystemRoadmap/ChunkingMethods.md
children:
prereqs:
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/SentenceBasedUsingSpacy.md
  - RagSystemRoadmap/Phase2PreprocessingChunking.md
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/NormalizeDigitsAndRemoveNoise.md
see_also:
  - RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
summary: Recursive chunking is a document splitting technique that first divides text by its major structural headers, then recursively subdivides those larger sections into smaller, semantically coherent units using length-based or content-based criteria.
model: provider/model
run_id: manual
---

# Recursive Chunking (split by headers → smaller units)

## Summary
Recursive chunking is a document splitting technique that first divides text by its major structural headers, then recursively subdivides those larger sections into smaller, semantically coherent units using length-based or content-based criteria.

## Key concepts
- **Hierarchical Decomposition**: A multi-level splitting approach that respects the natural hierarchy of a document, starting with large sections (like chapters) and breaking them down into progressively smaller pieces (like paragraphs).
- **Header Detection**: The process of identifying document headings using patterns like markdown `#`, HTML `<h1>`, or stylistic cues (font size, bolding) to find major topic boundaries.
- **Fallback Splitting**: When a section becomes too large but contains no internal headers, secondary splitting methods (like sentence or character count) are applied to create appropriately sized chunks.
- **Semantic Cohesion**: The goal of keeping related information together within a single chunk, which improves retrieval accuracy in [[RagSystemRoadmap/SemanticSearch.md]] systems.

## Why it matters
- **Preserves Context**: Unlike [[RagSystemRoadmap/FixedLength400600Tokens.md]] splitting, it keeps related concepts together by using headers as natural topic boundaries, preventing mid-paragraph fragmentation.
- **Adapts to Document Structure**: Works well for textbooks and manuals with clear hierarchies, automatically creating chunks that match the document's organizational logic.
- **Improves Retrieval Quality**: When a user queries about "photosynthesis," the system can retrieve the entire "Photosynthesis" section rather than fragmented pieces, leading to better [[RagSystemRoadmap/AnswerOnlyFromContext.md]].
- **Scalable Processing**: Handles documents of any length by recursively applying the same splitting logic, making it suitable for the [[RagSystemRoadmap/Phase2PreprocessingChunking.md]] phase.

## Core steps
- **Detect Header Patterns**: Scan for heading markers using regular expressions or format-specific parsers to identify major section boundaries, because headers indicate topic shifts that should be preserved as chunk boundaries.
  ```python
  # Using a recursive text splitter
  from langchain.text_splitter import RecursiveCharacterTextSplitter
  
  splitter = RecursiveCharacterTextSplitter(
      chunk_size=400,
      chunk_overlap=50,
      separators=["\n\n", "\n", ". ", " ", ""]  # Headers are implicit in the line breaks
  )
  ```
- **Split by Primary Headers**: Divide the document at each major header (H1, H2) to create initial large sections, since these represent the highest-level topic divisions in the document structure.
- **Apply Recursive Subdivision**: For each large section, check if it exceeds the target chunk size and apply further splitting using secondary separators (paragraphs, sentences), ensuring no chunk becomes too large for effective [[RagSystemRoadmap/EmbeddingGeneration.md]].
- **Add Overlap Between Chunks**: Include 50-100 token overlaps between adjacent chunks using [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md]] to prevent losing context that spans chunk boundaries during [[RagSystemRoadmap/ContextConstruction.md]].

## Checks
- **Are chunks respecting topic boundaries?**
  - ✔ A chapter about "Cell Structure" remains intact rather than being mixed with "DNA Replication"
  - ✘ A paragraph about mitochondria is split mid-sentence into two separate chunks
- **Is the chunk size distribution appropriate?**
  - ✔ Most chunks are between 200-600 tokens, with outliers only for indivisible content
  - ✘ Many chunks exceed 1000 tokens or are smaller than 50 tokens consistently
- **Does the overlap prevent context loss?**
  - ✔ A mathematical proof that spans two chunks has the key definitions repeated in both
  - ✘ A multi-step explanation is split between chunks with no overlapping context

## Failure modes
- **Over-fragmentation of Coherent Content**: Splitting naturally continuous content (like mathematical proofs or code examples) at arbitrary points because the algorithm doesn't recognize special content types, which can be fixed by [[RagSystemRoadmap/PreserveMathematicalAndDiagramMarkers.md]] and implementing content-aware splitting rules.
- **Missing Implicit Headers**: Failing to detect headings that use visual formatting rather than explicit markers, particularly in [[RagSystemRoadmap/PdfTextExtraction.md]] from scanned documents, which requires enhanced [[RagSystemRoadmap/OcrFallbackForImagePages.md]] with header detection heuristics.
- **Inconsistent Chunk Sizes**: Creating extremely variable chunk lengths when some sections have many subheaders while others have none, solved by implementing fallback to [[RagSystemRoadmap/SentenceBasedUsingSpacy.md]] or character-based splitting when header-based chunks become too large.

## Examples
- **Textbook Organization Analogy**: Like breaking down a biology textbook—first by units (Biology, Chemistry), then by chapters (Cell Biology, Genetics), then by sections (Mitosis, Meiosis), and finally by key concepts if sections are still too large, creating a hierarchy that mirrors how students naturally navigate the material.
- **Code Implementation**: Using a recursive splitter that respects markdown headers while ensuring reasonable chunk sizes:
  ```python
  # Python implementation with header awareness
  def split_by_headers_then_content(text, max_chunk_size=500):
      # First split by major headers (## in markdown)
      sections = re.split(r'\n## ', text)
      chunks = []
      
      for section in sections:
          if len(section) <= max_chunk_size:
              chunks.append(section)
          else:
              # Further split by paragraphs if section is too large
              paragraphs = section.split('\n\n')
              current_chunk = ""
              for para in paragraphs:
                  if len(current_chunk + para) > max_chunk_size:
                      if current_chunk:
                          chunks.append(current_chunk)
                          current_chunk = para
                  else:
                      current_chunk += "\n\n" + para
      return chunks
  ```

## Advanced notes
- **Combination with Semantic Methods**: For optimal results, recursive chunking can be followed by [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] to further refine chunks based on conceptual coherence rather than just structural boundaries.
- **Metadata Preservation**: Each chunk should [[RagSystemRoadmap/SaveChunkIdPageAndSource.md]] including header hierarchy information, enabling the [[RagSystemRoadmap/RetrieverLlamaindexLangchain.md]] to understand the contextual importance of different sections during [[RagSystemRoadmap/QueryQdrantForTopKChunks.md]].
- **Evaluation Considerations**: When running [[RagSystemRoadmap/EvalRunBenchmarks.md]], pay attention to whether header-based chunks improve [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]] compared to fixed-length approaches, particularly for queries about specific document sections.

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

