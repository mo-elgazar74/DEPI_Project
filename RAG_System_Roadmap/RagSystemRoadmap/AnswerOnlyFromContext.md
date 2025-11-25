---
id: rag-system-roadmap-system-prompt-design-answer-only-from-context_71536d45
type: leaf
parent: RagSystemRoadmap/SystemPromptDesign.md
children:
prereqs:
  - RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md
  - RagSystemRoadmap/AddShortFriendlyExamples.md
  - RagSystemRoadmap/SameLanguageAsQuestion.md
  - RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md
  - RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md
see_also:
  - RagSystemRoadmap/SystemPromptDesign.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: A system prompt design principle that instructs the language model to generate responses exclusively using information provided in the retrieved context, preventing hallucination of facts not present in the knowledge base.
model: provider/model
run_id: manual
---

# Answer only from context

## Summary
A system prompt design principle that instructs the language model to generate responses exclusively using information provided in the retrieved context, preventing hallucination of facts not present in the knowledge base.

## Key concepts
- **Hallucination prevention**: The model is explicitly told not to use its internal knowledge, which reduces incorrect information generation
- **Context dependency**: Responses are strictly limited to what's available in the retrieved documents, making retrieval quality critical
- **Fallback behavior**: When context lacks information, the model should acknowledge this limitation rather than invent answers
- **Source grounding**: Every factual claim in the response must be traceable to specific context passages

## Why it matters
- **Factual accuracy**: Eliminates model confabulation by restricting information sources to verified context
- **Trustworthiness**: Users can rely on answers being based on actual documents rather than model speculation
- **Debugging simplicity**: When answers are wrong, you know the problem is in retrieval, not generation
- **Consistency**: All users get answers from the same knowledge base, ensuring uniform information quality

## Core steps
- **Design explicit instruction**: Create clear system prompts that forbid external knowledge use, ensuring the model understands its constraints
  ```python
  system_prompt = """
  Answer the question using ONLY the provided context. 
  If the context doesn't contain the answer, say "The information is not available in the provided documents."
  Do not use any prior knowledge.
  """
  ```
- **Implement fallback mechanism**: Program the response template to handle missing information gracefully, maintaining user trust
- **Test boundary conditions**: Validate the system with questions outside the knowledge base, confirming it properly declines to answer

## Checks
- ✔ When asked about information not in context, system says "I cannot find that information"
- ✘ When asked about information not in context, system provides plausible but incorrect answer
- ✔ All facts in response can be traced to specific context passages with citations
- ✘ Response includes general knowledge not mentioned in the retrieved documents

## Failure modes
- **Overly restrictive prompting**: Making the prompt too strict can cause the model to reject answering even when context contains relevant information
  - **Why**: Poorly worded instructions that confuse the model about what constitutes "enough" information
  - **Fix**: Refine prompts to specify "use the context when sufficient information exists" rather than absolute restrictions
- **Context contamination**: The model subtly blends its internal knowledge with context information
  - **Why**: Insufficient reinforcement in the prompt about the exclusivity requirement
  - **Fix**: Add multiple examples showing correct context-only responses and incorrect knowledge-blending responses
- **Silent failure**: System provides incomplete answers without indicating missing information
  - **Why**: Missing explicit instruction to acknowledge information gaps
  - **Fix**: Include specific phrasing requirements like "Based on the available context..." or "The documents mention..."

## Examples
- **Library research analogy**: Like a librarian who only uses books from a specific reference section rather than their general knowledge - if the needed book isn't in that section, they tell you it's unavailable rather than guessing
- **Technical implementation**: The [[RagSystemRoadmap/SystemPromptUserQuestionRetrievedContext.md]] pattern structures the interaction to separate user question from provided context
  ```python
  # Correct implementation
  messages = [
      {"role": "system", "content": "Answer using only this context: {context}"},
      {"role": "user", "content": "Question: {question}"}
  ]
  ```

## Advanced notes
- **Progressive disclosure**: Start with strict "context only" then relax constraints for non-factual questions where creativity is acceptable
- **Confidence scoring**: Combine with [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md]] to handle partial information scenarios
- **Multi-document handling**: When context contains conflicting information, instruct the model to present multiple perspectives rather than synthesizing
- **Evaluation focus**: Use [[RagSystemRoadmap/GenerationFactualityFluency.md]] metrics specifically tuned to detect external knowledge contamination in responses

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

