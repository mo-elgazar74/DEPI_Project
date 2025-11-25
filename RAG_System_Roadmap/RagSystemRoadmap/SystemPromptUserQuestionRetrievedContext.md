---
id: rag-system-roadmap-prompt-composition-system-prompt-user-question-retrieved-context_1c608a59
type: leaf
parent: RagSystemRoadmap/PromptComposition.md
children:
prereqs:
  - RagSystemRoadmap/SystemPromptDesign.md
  - RagSystemRoadmap/QueryQdrantForTopKChunks.md
  - RagSystemRoadmap/BuildUnifiedContext.md
  - RagSystemRoadmap/CombineTopKSnippetsIntoOneContext.md
  - RagSystemRoadmap/Phase7EvaluationOptimization.md
see_also:
  - RagSystemRoadmap/PromptComposition.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: This prompt composition technique combines a system instruction, a user question, and relevant retrieved context into a single input for a language model to generate accurate, context-grounded answers in educational RAG systems.
model: provider/model
run_id: manual
---

# [System Prompt] + [User Question] + [Retrieved Context]

## Summary
This prompt composition technique combines a system instruction, a user question, and relevant retrieved context into a single input for a language model to generate accurate, context-grounded answers in educational RAG systems.

## Key concepts
*   **System Prompt**: A set of initial instructions that defines the AI's role, tone, and constraints, acting like a job description for the language model.
    *   *Example*: In a cooking assistant, the system prompt might be "You are a friendly chef. Always answer in simple steps and suggest common ingredient substitutes."
*   **User Question**: The specific query or problem posed by the end-user that the system needs to address.
    *   *Example*: A student might ask "How does photosynthesis work in plants that live in the desert?"
*   **Retrieved Context**: The most relevant pieces of information (chunks) fetched from a knowledge base, such as a VectorDatabaseQdrant|vector database, based on the user's question.
    *   *Example*: For the desert plant question, the system might retrieve a paragraph about CAM photosynthesis from a biology textbook.

## Why it matters
*   **Improves Answer Accuracy**: By providing the model with verified source material, it grounds the response in facts rather than relying on the model's potentially outdated or incorrect internal knowledge.
*   **Enables Source Citation**: Since the response is generated from specific context chunks, the system can [[RagSystemRoadmap/DisplayCitationsSourcePage.md|display citations]] showing the exact source and page number, building user trust.
*   **Controls Model Behavior**: The [[RagSystemRoadmap/SystemPromptDesign.md|system prompt]] sets guardrails, ensuring the AI responds in a helpful, safe, and context-appropriate manner, such as using [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md|simple explanations]] for young students.
*   **Reduces Hallucination**: Explicitly instructing the model to [[RagSystemRoadmap/AnswerOnlyFromContext.md|answer only from the provided context]] minimizes the risk of it inventing plausible-sounding but false information.

## Core steps
*   **Assemble the Final Prompt**: Programmatically combine the three elements into a single string or structured message, placing the system prompt first to set the AI's behavior, followed by the context, and ending with the user question.
    *   *Reason*: This order mimics a natural instruction-following flow for the language model.
    *   *Example*:
        ````python
        # A simplified code structure
        final_prompt = f"""
        System: {system_prompt}

        Context: {retrieved_context}

        User: {user_question}
        """
        ````
*   **Inject Retrieved Context**: Insert the top-K most relevant text chunks, fetched via [[RagSystemRoadmap/SemanticSearch.md|semantic search]], directly into the prompt template.
    *   *Reason*: Provides the raw material the AI needs to formulate a correct and specific answer.
    *   *Example*: The `retrieved_context` variable would be populated with the combined text from the top search results.
*   **Apply Instructional Guardrails**: Use the system prompt to enforce critical rules like [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md|stating when information is unavailable]] or responding in the [[RagSystemRoadmap/SameLanguageAsQuestion.md|same language as the question]].
    *   *Reason*: Ensures consistent, reliable, and user-friendly interactions.
    *   *Example*: The system prompt could contain the line: "If the answer cannot be found in the provided context, you must say 'This information is not available in the provided materials.'"

## Checks
*   ✔ **Is the context directly relevant to the question?**
    *   ✔ The question is "What is Newton's First Law?" and the context is a paragraph defining inertia.
    *   ✘ The question is about biology, but the context is a history text.
*   ✔ **Does the final prompt structure place the system instructions before the context and user input?**
    *   ✔ `[System] -> [Context] -> [User Question]`
    *   ✘ `[User Question] -> [System] -> [Context]`
*   ✔ **Is the AI's response strictly based on the provided context?**
    *   ✔ The answer cites details only found in the retrieved chunks.
    *   ✘ The answer includes general knowledge not present in the context.

## Failure modes
*   **Mistake**: Providing too much or irrelevant context in the prompt.
    *   *Why it happens*: Setting the [[RagSystemRoadmap/AdjustChunkSize.md|chunk size]] too large or retrieving too many chunks (a high Top-K value) can introduce noise.
    *   *How to fix it*: Optimize retrieval by using [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]] and [[RagSystemRoadmap/OptionallyRerankResults.md|reranking]] to improve precision, and fine-tune chunking strategies.
*   **Mistake**: The system prompt is too vague or conflicts with the context.
    *   *Why it happens*: Poor [[RagSystemRoadmap/SystemPromptDesign.md|system prompt design]] that doesn't clearly prioritize the provided context over the model's internal knowledge.
    *   *How to fix it*: Explicitly add instructions like "You are an expert tutor. Use ONLY the information in the Context below to answer the user's question."
*   **Mistake**: The model ignores the context and hallucinates an answer.
    *   *Why it happens*: The model's pre-training data might strongly bias it towards a common answer that differs from the specific context provided.
    *   *How to fix it*: Strengthen the system prompt with forceful language and place the context closer to the user question in the prompt structure to increase its weight.

## Examples
*   **Real-World Analogy**: Think of a teaching assistant. The **System Prompt** is their job description ("You must use the textbook"). The **Retrieved Context** is the specific page you've bookmarked for them. The **User Question** is the student's query. The assistant combines all three to give a textbook-accurate answer.
*   **Code Snippet**:
    ````python
    # Example of constructing the final prompt for an LLM API call
    def build_final_prompt(system_prompt, user_question, context_chunks):
        # Combine context chunks into one block
        combined_context = "\n\n".join([chunk['text'] for chunk in context_chunks])
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Based on the following context:\n\n{combined_context}\n\nQuestion: {user_question}"}
        ]
        return messages

    # Usage
    system_instruction = "You are a helpful educational AI. Answer the question using ONLY the provided context. If the answer isn't in the context, say so."
    user_query = "Explain the water cycle."
    retrieved_info = [chunk1, chunk2] # Retrieved from Qdrant
    prompt_for_llm = build_final_prompt(system_instruction, user_query, retrieved_info)
    ````

## Advanced notes
*   The order of elements in the prompt can significantly impact performance; some models are more sensitive to the placement of the system message and context than others.
*   For extremely long contexts, consider techniques like [[RagSystemRoadmap/AutoSummarization.md|auto-summarization]] on the retrieved chunks before injecting them into the prompt to stay within token limits.
*   The effectiveness of this entire composition hinges on the quality of the preceding [[RagSystemRoadmap/Phase5RetrievalLayer.md|retrieval layer]]; poor retrieval will lead to poor answers regardless of prompt engineering.
*   Experiment with different phrasings in the system prompt, such as [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|custom educational prompts]], and use an [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md|evaluation framework]] to measure their impact on answer quality.

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

