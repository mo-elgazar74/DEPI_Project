---
id: rag-system-roadmap-chunking-methods_85997dd6
type: hub
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
  - RagSystemRoadmap/FixedLength400600Tokens.md
  - RagSystemRoadmap/SentenceBasedUsingSpacy.md
  - RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md
  - RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md
prereqs:
see_also:
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/EmbeddingGeneration.md
summary: 
model: provider/model
run_id: manual
---

# **Chunking Methods**

## Summary
*   **Core Idea:** Chunking is the process of breaking down large documents into smaller, manageable pieces for a [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval system]].
*   **The Goal:** To create chunks that are small enough for efficient processing but large enough to retain meaningful context for accurate retrieval.
*   **The Spectrum:** Methods range from simple, rule-based splitting (like [[RagSystemRoadmap/FixedLength400600Tokens.md]]) to intelligent, content-aware grouping (like [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]]).

## When to use
*   **Use [[RagSystemRoadmap/FixedLength400600Tokens.md]] when:** You need a simple, fast baseline; your documents are uniform in structure and content.
    *   *Example: Processing a large collection of news articles where each article is roughly the same length and format.*
*   **Use [[RagSystemRoadmap/SentenceBasedUsingSpacy.md]] when:** Precision is critical, and you need to retrieve a single, self-contained fact or definition.
    *   *Example: A Q&A system for a glossary or a legal document where a specific clause needs to be found.*
*   **Use [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]] when:** Your documents have a clear hierarchical structure (e.g., textbooks, manuals, research papers with sections and subsections).
    *   *Example: Splitting a textbook chapter by its headings, then splitting the content under each heading into paragraphs.*
*   **Use [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] when:** Retrieval quality is paramount, and you want chunks that represent complete "ideas" or topics, even if they vary in length.
    *   *Example: Chunking a business report that smoothly transitions from discussing "Q3 Financials" to "Market Expansion Plans," ensuring each topic is a separate chunk.*

## Decision points
*   **Document Structure vs. Content Flow:**
    *   Choose [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]] if the document's *explicit structure* (headings, chapters) is a reliable guide.
    *   Choose [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] if the document's *thematic flow* is more important than its formatting.
*   **Speed vs. Intelligence:**
    *   [[RagSystemRoadmap/FixedLength400600Tokens.md]] and [[RagSystemRoadmap/SentenceBasedUsingSpacy.md]] are fast and computationally cheap.
    *   [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] is more computationally intensive but produces higher-quality, more coherent chunks.
*   **Chunk Size Consistency:**
    *   Do you need uniform-sized inputs for your embedding model? [[RagSystemRoadmap/FixedLength400600Tokens.md]] is the only method that guarantees this.
    *   Can you handle variable-sized chunks if it means better context? Consider [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] or [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]].
*   **Handling Context Fragmentation:**
    *   All methods risk splitting a key idea across two chunks. To mitigate this, use an [[RagSystemRoadmap/KeepOverlapOf50100Tokens.md|overlap]] between chunks, which is a common feature in chunking libraries.

## Examples
*   **Simple Analogy: Breaking a Book into Study Notes**
    *   **Fixed-Length:** Tearing every 10 pages out of the book, regardless of the content.
    *   **Sentence-Based:** Writing every single sentence from the book on its own index card.
    *   **Recursive:** First separating the book by chapters, then breaking each chapter down by its sub-sections.
    *   **Semantic:** Grouping all paragraphs that talk about "the causes of World War I" into one set of notes, and all paragraphs about "key battles" into another.
*   **Technical Snippet (Conceptual Code):**
    ```python
    # Fixed-Length Chunking (pseudo-code)
    text = "Your long document text here..."
    chunk_size = 500
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

    # Recursive Chunking (using a common pattern)
    # 1. Split by "\n\n" (double newline for paragraphs)
    # 2. If a paragraph is too long, split it by ". " (sentences)
    # 3. If a sentence is too long, split by " " (words)
    ```
*   **Real-World Case:**
    *   A legal AI uses [[RagSystemRoadmap/SentenceBasedUsingSpacy.md]] to find the exact sentence that defines "Force Majeure."
    *   An educational app uses [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]] to let students search for information within a specific textbook section (e.g., "Chapter 4, Section 2.1").
    *   A customer support chatbot uses [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] to retrieve a whole coherent paragraph about "resetting a password" instead of just a single, potentially out-of-context sentence.

## Key Takeaways
*   **There is no single "best" method.** The optimal chunking strategy is a hyperparameter that depends heavily on your specific documents and use case.
*   **Chunking is foundational.** Poor chunking can cripple an otherwise well-designed [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]], as the [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval system]] can only find what you've given it.
*   **Evaluate your chunks.** The best way to choose a method is to run [[RagSystemRoadmap/Evaluation.md|evaluations]]: perform test queries and see which chunking strategy retrieves the most relevant information.
*   **Start simple, then optimize.** Begin with [[RagSystemRoadmap/FixedLength400600Tokens.md]] or [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md]] as a baseline, then experiment with more advanced methods like [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]] if retrieval performance is lacking.

## Children
- [[RagSystemRoadmap/FixedLength400600Tokens.md|Fixed-Length (400–600 tokens)]]
- [[RagSystemRoadmap/SentenceBasedUsingSpacy.md|Sentence-Based (using spaCy)]]
- [[RagSystemRoadmap/RecursiveChunkingSplitByHeadersSmallerUnits.md|Recursive Chunking (split by headers → smaller units)]]
- [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md|Semantic Chunking (split by topic similarity)]]

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

