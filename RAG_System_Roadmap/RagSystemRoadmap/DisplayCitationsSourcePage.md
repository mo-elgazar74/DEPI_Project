---
id: rag-system-roadmap-frontend-display-citations-source-page_b4eb1086
type: leaf
parent: RagSystemRoadmap/Frontend.md
children:
prereqs:
  - RagSystemRoadmap/ChatStyleQAInterface.md
  - RagSystemRoadmap/SaveChunkIdPageAndSource.md
  - RagSystemRoadmap/VectorMetadataSourcePageSubject.md
  - RagSystemRoadmap/SaveStructuredJsonWithMetadata.md
  - RagSystemRoadmap/StackReactTailwind.md
see_also:
  - RagSystemRoadmap/DropdownsForGradeTermSubject.md
  - RagSystemRoadmap/Phase9ContinuousImprovement.md
  - RagSystemRoadmap/Frontend.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
summary: This feature shows users the exact source document and page number for each piece of information in the AI's answer, building trust and enabling fact-checking by providing transparent references.
model: provider/model
run_id: manual
---

# Display citations (source + page)

## Summary
This feature shows users the exact source document and page number for each piece of information in the AI's answer, building trust and enabling fact-checking by providing transparent references.

## Key concepts
- **Citation metadata**: The source and page information stored with each text chunk during [[RagSystemRoadmap/SaveChunkIdPageAndSource.md|chunk creation]], which acts like a library card catalog entry pointing to the original location
- **Source attribution**: The process of matching generated text back to its origin documents, similar to how academic papers include footnotes for every claim
- **Visual indicators**: UI elements like highlighted text or numbered references that show users which parts of the answer come from which sources, creating a clear connection between information and its proof
- **Page-level precision**: Showing exact page numbers rather than just document names, giving users the ability to verify information at the most granular level possible

## Why it matters
- **Builds user trust** by making the AI's knowledge traceable and verifiable, preventing the "black box" effect where answers appear from nowhere
- **Enables fact-checking** by allowing users to look up the original context, similar to how Wikipedia citations let readers verify information against primary sources
- **Supports educational use** where students and teachers need to reference specific textbook pages, making the system suitable for academic environments
- **Improves answer quality** since developers can audit which sources contribute to responses and identify knowledge gaps or poor sources

## Core steps
- **Retrieve source metadata during [[RagSystemRoadmap/ContextConstruction.md]]** to ensure each text chunk carries its provenance information through the pipeline, preventing citation loss
  ```python
  # When building context from retrieved chunks
  def build_context_with_citations(retrieved_chunks):
      context_parts = []
      citation_map = {}
      
      for i, chunk in enumerate(retrieved_chunks):
          context_parts.append(chunk.text)
          citation_map[i] = {
              'source': chunk.metadata['source'],
              'page': chunk.metadata['page'],
              'chunk_id': chunk.metadata['chunk_id']
          }
      return "\n\n".join(context_parts), citation_map
  ```

- **Embed citation markers in the [[RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md|system prompt]]** to guide the AI to acknowledge specific sources, teaching the model to be transparent about its references
  ```python
  CITATION_PROMPT = """
  Use the following retrieved context to answer the question.
  Reference sources using [1], [2] etc. where:
  [1] = Source: {source1}, Page: {page1}
  [2] = Source: {source2}, Page: {page2}
  
  Context:
  {context}
  
  Question: {question}
  """
  ```

- **Parse AI response for citation markers** to extract the reference numbers and map them back to actual source documents, functioning like a bibliography compiler
  ```python
  import re
  
  def extract_citations(response_text):
      # Find patterns like [1], [2] or [1,3] in the response
      citation_pattern = r'\[(\d+(?:,\s*\d+)*)\]'
      matches = re.findall(citation_pattern, response_text)
      
      citation_indices = []
      for match in matches:
          indices = [int(idx.strip()) for idx in match.split(',')]
          citation_indices.extend(indices)
      
      return list(set(citation_indices))  # Remove duplicates
  ```

- **Render visual citations in the [[RagSystemRoadmap/Frontend.md]]** using hover tooltips or sidebar references that display source details on demand, creating an intuitive user experience
  ```jsx
  // React component for citation display
  function CitationMarker({ citationNumber, source, page }) {
    return (
      <sup className="citation-marker">
        [{citationNumber}]
        <div className="citation-tooltip">
          Source: {source}, Page: {page}
        </div>
      </sup>
    );
  }
  ```

## Checks
- **When a user asks "Where did this information come from?", can they immediately see the source?**
  - ✔ Answer shows "According to Science Textbook 8th Grade [p. 45]" with clickable reference
  - ✘ Answer provides information without any source attribution or page numbers

- **Does clicking a citation reference show the exact page and document?**
  - ✔ Clicking [1] displays tooltip: "Mathematics Curriculum, Grade 5, Page 127"
  - ✘ Clicking citation shows only document name without page specificity

- **Are citations consistently displayed for all factual claims in the answer?**
  - ✔ Every historical date and scientific fact has a corresponding source marker
  - ✘ Some facts are cited while others appear without references

## Failure modes
- **Missing citation metadata** occurs when the [[RagSystemRoadmap/SaveChunkIdPageAndSource.md|metadata saving step]] is skipped during chunking, leaving no source information to display
  - **Why**: Pipeline optimization that strips "unnecessary" metadata to save space
  - **Fix**: Ensure metadata preservation throughout [[RagSystemRoadmap/Phase2PreprocessingChunking.md|preprocessing]] and [[RagSystemRoadmap/Phase4VectorDatabaseLayer.md|vector storage]]

- **AI ignores citation instructions** happens when the [[RagSystemRoadmap/SystemPromptDesign.md|system prompt]] lacks emphasis on source attribution or the model is poorly tuned
  - **Why**: Vague prompting that doesn't enforce citation formatting
  - **Fix**: Use explicit citation templates and [[RagSystemRoadmap/Evaluation.md|evaluate]] model compliance

- **Frontend citation mapping errors** occur when the UI fails to correctly associate response text with source data
  - **Why**: Complex string parsing that breaks when response format varies
  - **Fix**: Implement robust citation extraction with fallback patterns

## Examples
- **Academic paper analogy**: Like research papers with numbered citations [1,2] that correspond to a reference list, our system shows [1] for "Science Textbook p.45" and [2] for "Mathematics Guide p.127"

- **Library receipt example**: Similar to how library checkout receipts show which books you borrowed and their due dates, citation display shows which sources contributed to the answer and their specific pages

- **Complete implementation snippet** showing how citations flow from retrieval to display:
  ```python
  def generate_answer_with_citations(question, retrieved_chunks):
      # Build context with citation mapping
      context, citation_map = build_context_with_citations(retrieved_chunks)
      
      # Generate answer with citation markers
      prompt = CITATION_PROMPT.format(
          context=context,
          question=question,
          **{f"source{i}": citation_map[i]['source'] for i in citation_map}
      )
      
      response = llm.generate(prompt)
      citation_indices = extract_citations(response)
      
      # Return both answer and citation data for frontend
      return {
          'answer': response,
          'citations': [citation_map[i] for i in citation_indices]
      }
  ```

## Advanced notes
- **Dynamic citation highlighting** can be implemented where hovering over a citation in the answer highlights the corresponding text in the original document preview, creating a bidirectional reference system
- **Citation confidence scoring** could weight sources by reliability, showing users when information comes from verified textbooks versus potentially less reliable sources
- **Multi-source attribution** handles cases where a single sentence synthesizes information from multiple documents, requiring compound citations like [1,3] to represent combined sources
- **Cross-document citation tracking** becomes important when implementing [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] where results come from both vector and keyword searches across different document collections

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

