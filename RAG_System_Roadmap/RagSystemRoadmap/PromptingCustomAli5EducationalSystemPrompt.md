---
id: rag-system-roadmap-prompting-custom-ali5-educational-system-prompt_7f073e8f
type: leaf
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
prereqs:
  - RagSystemRoadmap/SystemPromptDesign.md
  - RagSystemRoadmap/GeneratorGroqOpenaiMistral.md
  - RagSystemRoadmap/RetrieverLlamaindexLangchain.md
  - RagSystemRoadmap/ContextConstruction.md
  - RagSystemRoadmap/SemanticSearch.md
see_also:
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/Tips.md
summary: This prompt instructs the [[GeneratorGroqOpenaiMistral|LLM generator]] to explain complex topics in simple, imaginative terms suitable for a young child, using analogies, short sentences, and a friendly tone to enhance learning accessibility.
model: provider/model
run_id: manual
---

# **Prompting:** Custom "Ali5" educational system prompt

## Summary
This prompt instructs the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM generator]] to explain complex topics in simple, imaginative terms suitable for a young child, using analogies, short sentences, and a friendly tone to enhance learning accessibility.

## Key concepts
*   **Ali5 Mode:** A specific instruction set for the AI, telling it to "Explain Like I'm 5." This means using simple vocabulary, relatable analogies, and a conversational tone.
    *   *Example:* Instead of "Photosynthesis is a biochemical process," the AI would say, "A plant eats sunlight like you eat your breakfast to grow big and strong!"
*   **System Prompt:** The core set of instructions given to an LLM at the beginning of a conversation to define its personality, capabilities, and constraints, which guides all its subsequent responses.
    *   *Example:* In code, this is the `system` role message in the API call, separate from the `user` question.
*   **Tone and Style Guardrails:** Rules within the prompt that prevent the AI from slipping into formal, technical language, ensuring the explanation remains engaging and age-appropriate.
    *   *Example:* A rule like "Never use jargon. If you must mention a complex term, immediately explain it with a simple analogy."

## Why it matters
*   **Improves Knowledge Accessibility:** Breaks down intimidating subjects into digestible pieces, making learning less daunting for beginners or young students.
    *   *Example:* A complex topic like gravity becomes "The Earth is like a giant magnet for your feet, pulling you down so you don't float away."
*   **Engages Different Learning Styles:** Uses storytelling and analogies, which are highly effective for auditory and conceptual learners, making the educational [[RagSystemRoadmap/ChatStyleQAInterface.md|chat interface]] more interactive.
    *   *Example:* Explaining computer memory by comparing RAM to a desk space (fast, temporary) and a hard drive to a filing cabinet (slow, permanent).
*   **Reduces User Frustration:** Provides a consistent, simplified output, which is crucial for an educational tool where users may already feel confused by the subject matter, enhancing the overall [[RagSystemRoadmap/Goal.md|project goal]] of being a helpful tutor.

## Core steps
*   **Define the Persona:** Instruct the AI to adopt the role of a friendly teacher for a young child. This sets the foundational behavior for all interactions.
    *   *Reason:* Establishes the context and tone from the very first response.
    *   *Example:*
        ````
        system_prompt = """
        You are a friendly teacher explaining things to a 5-year-old child. Your goal is to make complex ideas simple and fun.
        """
        ````
*   **Specify the "Ali5" Rules:** Explicitly list the linguistic constraints, such as word length, sentence structure, and the mandatory use of analogies.
    *   *Reason:* Provides clear, actionable guidelines for the AI to follow, ensuring consistency in the simplified output.
    *   *Example:*
        ````
        ali5_rules = """
        - Use words a 5-year-old would understand.
        - Keep sentences short.
        - Always use a fun analogy or a story.
        - Be encouraging and warm.
        """
        ````
*   **Integrate with RAG Context:** Combine the Ali5 instructions with the command to only answer from the provided [[RagSystemRoadmap/BuildUnifiedContext.md|retrieved context]] to maintain factual accuracy.
    *   *Reason:* Ensures the simple explanations are still grounded in the correct information from the knowledge base.
    *   *Example:*
        ````
        full_system_prompt = f"""
        {system_prompt}
        {ali5_rules}
        You MUST only use the information from the provided context to answer the question.
        If the answer is not in the context, say "I don't know that yet!"
        """
        ````

## Checks
*   **Is the explanation free of technical jargon?**
    *   ✔ "Clouds are like giant, fluffy cotton balls in the sky that hold water."
    *   ✘ "Clouds are accumulations of water droplets or ice crystals suspended in the atmosphere."
*   **Does it use a relatable analogy or story?**
    *   ✔ "Your brain is like a super-powered computer that helps you think, feel, and play!"
    *   ✘ "The brain is a complex organ of the nervous system."
*   **Is the tone encouraging and simple?**
    *   ✔ "That's a great question! Let's think of a tree drinking water through its roots like a straw."
    *   ✘ "The process of capillary action in xylem vessels facilitates water transport."

## Failure modes
*   **Mistake:** The AI ignores the Ali5 rules and provides a textbook-style answer.
    *   **Why it happens:** The retrieved context from the [[RagSystemRoadmap/SemanticSearch.md|semantic search]] is highly technical, and the AI's default behavior to reproduce information precisely overpowers the style instructions.
    *   **How to fix it:** Strengthen the system prompt with negative instructions (e.g., "Never use complex terms like 'biochemical' or 'algorithmic'") and use a more powerful [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM generator]] that is better at following complex instructions.
*   **Mistake:** The analogy is creative but factually incorrect.
    *   **Why it happens:** The AI prioritizes making a simple, fun analogy over strict factual fidelity to the context.
    *   **How to fix it:** Reinforce the [[RagSystemRoadmap/AnswerOnlyFromContext.md|"answer only from context"]] rule in the prompt and implement [[RagSystemRoadmap/HumanReview.md|human review]] loops to catch and correct analogical drift during the [[RagSystemRoadmap/Phase9ContinuousImprovement.md|continuous improvement]] phase.
*   **Mistake:** The response is condescending or loses key information due to oversimplification.
    *   **Why it happens:** The AI misinterprets "simple" as "childish" or strips out necessary concepts to meet sentence length rules.
    *   **How to fix it:** Refine the prompt to specify "clear and simple, but not condescending," and allow for slightly longer explanations if they are broken into very short, sequential sentences.

## Examples
*   **Real-World Analogy:** Think of the Ali5 prompt as a translator. Your [[RagSystemRoadmap/Backend.md|backend]] system retrieves a "document" written in "Expert Language." The Ali5 prompt is the translator who reads that document and then tells the student a "story" in "Kid Language" that conveys the same core idea.
*   **Code Snippet:** Here is how the complete system prompt might be structured in a [[RagSystemRoadmap/FrameworkFastapi.md|FastAPI]] backend before sending to the LLM.
    ````
    def create_ali5_system_prompt(retrieved_context, user_question):
        system_message = {
            "role": "system",
            "content": f"""
            You are a friendly and patient teacher for a 5-year-old child.
            Explain the following information in a simple, fun way using analogies and short sentences.
            Do not use any complex words or jargon.

            Context to use for your answer:
            {retrieved_context}

            The child's question is: {user_question}

            Remember: If the answer isn't in the context above, just say you don't know!
            """
        }
        return system_message
    ````
    *Explanation:* This function assembles the final instruction set, combining the Ali5 persona, the rules, the specific [[RagSystemRoadmap/ContextConstruction.md|constructed context]], and the user's question into a single prompt for the LLM.

## Advanced notes
*   The effectiveness of the Ali5 prompt is highly dependent on the quality of the [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieved context]]; if the retrieved chunks are too dense or technical, even the best prompt will struggle to simplify them effectively, suggesting a need for [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md|semantic chunking]].
*   For a production system, consider making the "simplicity level" a user-configurable setting (e.g., Ali5, Ali10, Ali15) via the [[RagSystemRoadmap/Frontend.md|frontend]] [[RagSystemRoadmap/DropdownsForGradeTermSubject.md|dropdowns]], which would dynamically adjust the system prompt.
*   This prompting strategy can be combined with the [[RagSystemRoadmap/ExplainAgainButtonReSimplifyResponse.md|"Explain Again" button]] feature, where a click sends the same context back to the LLM with a fresh Ali5 prompt, often generating a new, helpful analogy.

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

