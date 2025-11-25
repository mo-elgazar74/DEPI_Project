---
id: rag-system-roadmap-backend-endpoints-index-add-new-documents_2fb16f02
type: leaf
parent: RagSystemRoadmap/Endpoints.md
children:
prereqs:
  - RagSystemRoadmap/Endpoints.md
  - RagSystemRoadmap/FrameworkFastapi.md
  - RagSystemRoadmap/Backend.md
  - RagSystemRoadmap/DatabaseQdrant.md
  - RagSystemRoadmap/EmbeddingGeneration.md
see_also:
  - RagSystemRoadmap/AskHandleQuestionAnswering.md
  - RagSystemRoadmap/EvalRunBenchmarks.md
summary: This endpoint ingests new educational documents, processes them into searchable chunks, generates vector embeddings, and stores them in the [[DatabaseQdrant|vector database]] to expand the knowledge base for the [[RagSystemRoadmap|RAG system]].
model: provider/model
run_id: manual
---

# `/index` – add new documents

## Summary
This endpoint ingests new educational documents, processes them into searchable chunks, generates vector embeddings, and stores them in the [[RagSystemRoadmap/DatabaseQdrant.md|vector database]] to expand the knowledge base for the [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]].

## Key concepts
- **Document ingestion** is the process of taking raw files (PDFs, text) and converting them into a structured format the system can understand and search, similar to a librarian scanning and cataloging new books before placing them on the correct shelves.
- **Chunking** ([[RagSystemRoadmap/ChunkingMethods.md]]) breaks long documents into smaller, manageable pieces; for example, using a [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md|recursive splitter]] ensures a chapter is split into sections, then into paragraphs, preserving logical flow.
- **Vector embeddings** ([[RagSystemRoadmap/EmbeddingGeneration.md]]) are numerical representations of text meaning; the system uses the [[RagSystemRoadmap/ToolHuggingfaceIntfloatMultilingualE5Small.md|multilingual E5 model]] to [[RagSystemRoadmap/ConvertTextChunksIntoDenseVectors384Dim.md|convert chunks into 384-dimensional vectors]] that capture semantic relationships.
- **Upsert operation** adds new vectors or updates existing ones in [[RagSystemRoadmap/DatabaseQdrant.md|Qdrant]]; it's like adding new index cards to a filing cabinet, replacing old ones if the document ID already exists to avoid duplicates.

## Why it matters
- It populates the [[RagSystemRoadmap/BuildFastSemanticSearchDatabase.md|semantic search database]], enabling the [[RagSystemRoadmap/AskHandleQuestionAnswering.md|/ask endpoint]] to find relevant information for answering student questions accurately and quickly.
- Without this process, the RAG system has an empty knowledge base, similar to a search engine with no web pages to search, rendering it useless for educational queries.
- Proper indexing directly impacts [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval quality]]; well-chunked and embedded documents lead to better context for the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM generator]], improving final answer [[RagSystemRoadmap/GenerationFactualityFluency.md|factuality and fluency]].

## Core steps
- **Extract raw text** from uploaded documents using [[RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md|PyMuPDF and Tesseract]] to handle both digital PDFs and scanned images, ensuring all textual content is captured for processing.
  ```python
  # Using PyMuPDF for text extraction
  import fitz
  doc = fitz.open("math_textbook.pdf")
  text = "\n".join([page.get_text() for page in doc])
  ```
- **Clean and normalize text** by removing special characters and normalizing digits through [[RagSystemRoadmap/TextCleaning.md|text cleaning]] functions, creating consistent input for chunking and improving embedding quality.
- **Split documents into chunks** using [[RagSystemRoadmap/ChunkingRegexRecursiveSplitter.md|recursive chunking]] with [[RagSystemRoadmap/FixedLength400600Tokens.md|400-600 token size]] and [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md|50-100 token overlap]] to maintain context across chunks, similar to cutting a long video into clips with slight overlaps for smooth transitions.
- **Generate vector embeddings** for each chunk using the [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|multilingual E5-small model]], which [[RagSystemRoadmap/ConvertTextChunksIntoDenseVectors384Dim.md|creates 384-dimensional vectors]] that represent the semantic meaning of the educational content.
- **Store vectors in Qdrant** using the [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md|upsert operation]] with [[RagSystemRoadmap/VectorMetadataSourcePageSubject.md|metadata]] including source, page number, and subject, organizing the knowledge for efficient [[RagSystemRoadmap/SemanticSearch.md|semantic search]] during retrieval.

## Checks
- ✔ Does the chunk size balance context preservation and search precision? (e.g., ~500 tokens)
  ✘ Chunks are either too large (losing focus) or too small (losing context)
- ✔ Are mathematical symbols and diagrams preserved during text extraction? ([[RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md]])
  ✘ Equations appear as garbled text, making math questions unanswerable
- ✔ Does the vector database return results after indexing? ([[RagSystemRoadmap/VerifyCollectionsWithGetCollections.md]])
  ✘ Querying the collection returns zero results, indicating indexing failure
- ✔ Is metadata (source, page) correctly attached to each chunk? ([[RagSystemRoadmap/SaveChunkIdPageAndSource.md]])
  ✘ Answers lack citations because source information wasn't stored

## Failure modes
- **Poor chunking strategy** occurs when using fixed-length splitting without considering semantic boundaries, causing related concepts to be split across chunks; fix by implementing [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md|semantic chunking]] that groups text by topic similarity.
- **Incomplete text extraction** happens with image-based PDFs when OCR isn't used, leaving diagrams and handwritten notes unreadable; implement [[RagSystemRoadmap/OcrFallbackForImagePages.md|OCR fallback]] using Tesseract to extract text from all page types.
- **Duplicate document indexing** occurs when the same document is processed multiple times without checks, wasting storage and causing redundant results; add a document hash check before processing and use [[RagSystemRoadmap/UpsertPointsIdVectorPayload.md|upsert]] to update rather than duplicate.

## Examples
- **Real-world analogy**: Indexing documents is like preparing ingredients before cooking—you wash (clean text), chop (chunk), and organize (embed/store) them so they're ready to use when following a recipe (answering a question).
- **Code example**: A complete indexing flow might look like this:
  ```python
  # 1. Extract and clean text
  raw_text = extract_text_with_pymupdf("science_ebook.pdf")
  clean_text = normalize_text(raw_text)
  
  # 2. Chunk document
  from langchain.text_splitter import RecursiveCharacterTextSplitter
  splitter = RecursiveCharacterTextSplitter(
      chunk_size=500, chunk_overlap=50)
  chunks = splitter.split_text(clean_text)
  
  # 3. Generate embeddings and store
  from qdrant_client import QdrantClient
  client = QdrantClient("localhost")
  for i, chunk in enumerate(chunks):
      vector = embed_with_e5(chunk)  # 384-dim vector
      payload = {"source": "science_ebook.pdf", "page": i//10}
      client.upsert(collection_name="textbooks", points=[{
          "id": i, "vector": vector, "payload": payload}])
  ```

## Advanced notes
- For large-scale indexing, implement [[RagSystemRoadmap/AsyncSearchForSpeed.md|async processing]] to handle multiple documents simultaneously, significantly reducing total indexing time through parallel text extraction and embedding generation.
- Consider [[RagSystemRoadmap/FineTunedEmbeddingsForArabicDomain.md|fine-tuning embeddings]] specifically for Arabic educational content if the default multilingual model underperforms on domain-specific terminology and concepts.
- Implement [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] by storing both vector embeddings and keyword-based BM25 indices during the indexing phase, enabling more flexible retrieval that combines semantic and exact keyword matching.

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

