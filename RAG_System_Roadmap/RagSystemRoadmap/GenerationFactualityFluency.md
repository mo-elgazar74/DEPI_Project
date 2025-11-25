---
id: rag-system-roadmap-evaluation-generation-factuality-fluency_fe191178
type: leaf
parent: RagSystemRoadmap/Evaluation.md
children:
prereqs:
  - RagSystemRoadmap/RetrievalPrecisionKRecallK.md
  - RagSystemRoadmap/HumanReview.md
  - RagSystemRoadmap/AnswerOnlyFromContext.md
  - RagSystemRoadmap/QueryQdrantForTopKChunks.md
  - RagSystemRoadmap/CombineTopKSnippetsIntoOneContext.md
see_also:
  - RagSystemRoadmap/Evaluation.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: This phase ensures the final AI-generated answer is both factually accurate by strictly adhering to the retrieved context and fluent by being well-written, clear, and easy to understand.
model: provider/model
run_id: manual
---

# Generation: factuality, fluency

## Summary
This phase ensures the final AI-generated answer is both factually accurate by strictly adhering to the retrieved context and fluent by being well-written, clear, and easy to understand.

## Key concepts
*   **Factuality** means the information in the generated answer is correct and can be verified against the source documents provided to the AI; it prevents the system from inventing facts, a problem known as "hallucination."
    *   *Example*: If the source text says "The heart has four chambers," a factual response will repeat this exactly, while a non-factual one might incorrectly say it has three.
*   **Fluency** refers to the quality of the language in the answer, ensuring it is grammatically correct, coherent, and reads naturally, as if written by a human.
    *   *Example*: A fluent answer to "How does photosynthesis work?" would be a smooth paragraph, not a jumbled list of disjointed biological terms.
*   **System Prompt** is the primary instruction set given to the LLM that governs its behavior, explicitly telling it to only use the provided context to ensure factuality.
    *   *Example*: A prompt might be: "Answer the question based *only* on the following context. If the answer is not in the context, say 'I don't know.'"

## Why it matters
*   **Builds User Trust**: Factually correct answers make the system reliable, encouraging users to depend on it for accurate information, which is critical in educational and professional settings.
    *   *Example*: A student using the system for homework will trust it if it consistently provides correct information from their textbook.
*   **Prevents Misinformation**: By constraining the AI to its sources, it stops the spread of "hallucinated" or made-up information, which is a common failure mode for large language models.
    *   *Example*: Without this guardrail, an AI might invent a false historical date that a user could then propagate.
*   **Enhances User Experience**: Fluent, well-structured answers are simply easier and more pleasant to read, reducing cognitive load and helping users understand complex topics quickly.
    *   *Example*: A clear, step-by-step explanation of a math problem is far more useful than a confusing, grammatically flawed one.

## Core steps
*   **Compose a strict system prompt** to instruct the LLM to base its answer solely on the provided context, which is the most direct method to enforce factuality and prevent hallucinations.
    *   *Example*: The [[RagSystemRoadmap/SystemPromptDesign.md]] for our [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md]] includes the instruction: `"You are an educational assistant. Using *only* the information from the provided context, answer the user's question. If the answer is not found in the context, you must state, 'The information is not available in the provided materials.'"`
*   **Construct the final context window** by combining the top retrieved chunks into a single, cohesive block of text that the LLM will use as its knowledge base for generating the answer.
    *   *Example*: The [[RagSystemRoadmap/CombineTopKSnippetsIntoOneContext.md]] step assembles the text from the top 5 chunks retrieved by [[RagSystemRoadmap/QueryQdrantForTopKChunks.md]] before sending it to the generator.
*   **Invoke the LLM generator** by sending the meticulously crafted prompt and the unified context, leveraging a powerful model to produce a final, fluent, and context-grounded answer for the user.
    *   *Example*: Using the Groq API with a Mistral model to generate the response.
        ```python
        # Example API call structure
        response = groq.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Question: {user_question}\nContext: {unified_context}"}
            ]
        )
        answer = response.choices[0].message.content
        ```

## Checks
*   **Does the answer contain information not present in the source context?**
    *   ✔ "The text states the Nile is approximately 6,650 km long."
    *   ✘ "The Nile is the longest river, about 6,800 km long." (if the source says 6,650 km).
*   **Is the answer grammatically sound and logically structured?**
    *   ✔ "Photosynthesis converts light energy into chemical energy. This process requires sunlight, water, and carbon dioxide."
    *   ✘ "Photosynthesis light energy, chemical energy. Needs sun, water, CO2."
*   **When the context is insufficient, does the system correctly admit it doesn't know?**
    *   ✔ "The information about the author's birthplace is not available in the provided materials."
    *   ✘ "The author was probably born in London." (when the context doesn't specify).

## Failure modes
*   **Mistake**: The LLM "hallucinates" plausible-sounding but incorrect details.
    *   **Why it happens**: The system prompt is not restrictive enough, or the LLM's internal knowledge overrides the provided context.
    *   **How to fix it**: Strengthen the [[RagSystemRoadmap/SystemPromptDesign.md]] with explicit commands like `"Do not use any prior knowledge"` and implement [[RagSystemRoadmap/AnswerOnlyFromContext.md]] as a hard rule.
*   **Mistake**: The answer is a disjointed copy-paste of context snippets, lacking fluency.
    *   **Why it happens**: The LLM is not effectively synthesizing the information from the [[RagSystemRoadmap/BuildUnifiedContext.md]] step.
    *   **How to fix it**: Use a more capable [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md]] model and refine the prompt to instruct it to "synthesize a coherent and concise answer."
*   **Mistake**: The answer is fluent but ignores key facts from the context, showing a lack of factual grounding.
    *   **Why it happens**: The retrieved context might be too large or noisy, causing the LLM to miss critical information.
    *   **How to fix it**: Improve [[RagSystemRoadmap/ContextConstruction.md]] by using [[RagSystemRoadmap/OptionallyRerankResults.md]] to prioritize the most relevant chunks and experiment with [[RagSystemRoadmap/AdjustChunkSize.md]].

## Examples
*   **Real-world analogy**: Think of the generation phase like a chef preparing a dish. The retrieved context is the set of fresh, pre-approved ingredients. Factuality is the chef using *only* those ingredients (not making a substitution that changes the dish). Fluency is the chef's skill in combining them into a delicious, well-presented meal, not just serving the raw ingredients on a plate.
*   **Code Snippet**: Here is a simplified version of the prompt engineering used to control the generator's output.
    ```python
    # This is the core system prompt for factuality and fluency
    SYSTEM_PROMPT = """
    You are a helpful and precise educational assistant.
    Strictly follow these rules:
    1. Answer the user's question using ONLY the facts from the provided context.
    2. Do not add any information, even if you think it is true.
    3. If the context does not contain the answer, you MUST say: "The information is not available in the provided materials."
    4. Synthesize the information from the context into a clear, well-written, and easy-to-understand paragraph.
    
    Context: {context}
    """
    ```

## Advanced notes
*   For specialized use cases like explaining complex topics to young students, a custom [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md]] can be layered on top of the base factual prompt to enhance fluency for a specific audience.
*   Automated [[RagSystemRoadmap/Evaluation.md]] of factuality and fluency can be implemented using tools like [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md]] to run [[RagSystemRoadmap/EvalRunBenchmarks.md]] and score outputs without manual [[RagSystemRoadmap/HumanReview.md]] for every response.
*   The choice of [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md]] is a key factor; larger, more instruction-tuned models generally achieve better fluency and are more adept at following complex prompts designed to ensure factuality.

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

