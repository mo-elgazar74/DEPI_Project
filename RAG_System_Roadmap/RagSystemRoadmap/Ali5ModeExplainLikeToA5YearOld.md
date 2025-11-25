---
id: rag-system-roadmap-system-prompt-design-ali5-mode-explain-like-to-a-5-year-old_b0b86393
type: leaf
parent: RagSystemRoadmap/SystemPromptDesign.md
children:
prereqs:
  - RagSystemRoadmap/AnswerOnlyFromContext.md
  - RagSystemRoadmap/SameLanguageAsQuestion.md
  - RagSystemRoadmap/AddShortFriendlyExamples.md
  - RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md
see_also:
  - RagSystemRoadmap/SystemPromptDesign.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: Ali5 mode is a special instruction you give to a smart computer program so it answers questions using super simple words and fun examples, just like you would explain something to a 5-year-old child.
model: provider/model
run_id: manual
---

# “Ali5 mode” – explain like to a 5-year-old

## Summary

Ali5 mode is a special instruction you give to a smart computer program so it answers questions using super simple words and fun examples, just like you would explain something to a 5-year-old child.

## Key concepts

*   **Simple Language:** The computer uses only easy, common words that a young child would know, avoiding all complicated or technical terms.
    *   *Example:* Instead of saying "photosynthesis," it might say "plants use sunlight to eat and grow."
*   **Fun Examples:** It connects new ideas to things a child already understands from their everyday life, like toys, games, or food.
    *   *Example:* To explain how a computer stores information, you could say, "It's like having a giant toy box where every toy has its own special spot so you can find it quickly."
*   **Short Sentences:** The computer gives answers in short, clear thoughts instead of long, confusing paragraphs to make it easier to follow.
    *   *Example:* `"The sun is a big, hot ball in the sky. It gives us light. It helps plants grow."`

## Why it matters

*   It makes learning easier for everyone, especially young students or people who are new to a topic, by removing the barrier of complex language.
*   It helps ensure the core idea of a topic is understood before adding more complicated details, building a strong foundation of knowledge.
*   It makes the learning experience more friendly and less intimidating, encouraging users to ask more questions.
    *   *Example:* A child is more likely to ask "How do airplanes fly?" if they know the answer will be a fun story about a big metal bird, not a lecture about aerodynamics.

## Core steps

*   **Action:** Instruct the language model using a special System Prompt Design|system prompt that defines the Ali5 persona.
    *   **Reason:** This sets the rules for *how* the AI should talk, ensuring every answer follows the Ali5 style.
    *   **Example:**
        ````python
        system_prompt = """
        You are a friendly teacher for 5-year-old children. Your name is Professor Popsicle.
        - Use very simple words.
        - Use fun examples from toys, games, or animals.
        - Keep your answers short and happy!
        """
        ````
*   **Action:** Combine this Ali5 prompt with the user's question and the relevant information retrieved from your knowledge base.
    *   **Reason:** This gives the AI both the style to use (Ali5) and the correct facts to explain (from the [[RagSystemRoadmap/BuildUnifiedContext.md|unified context]]).
    *   *Example:* The final prompt sent to the AI looks like: `[Ali5 Instructions] + [User Question: "What is rain?"] + [Retrieved Fact: "Rain is liquid water in the form of droplets..."]`
*   **Action:** Use a powerful language model ([[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|Generator]]) that is good at following creative instructions to generate the final, simple answer.
    *   **Reason:** Not all AI models are equally good at adopting a persona; you need one that is skilled at instruction-following.
    *   *Example:* The model takes the combined prompt and outputs: "Rain is the sky giving the flowers and trees a drink! When clouds get too full of water, they let it fall down as little drips."

## Checks

*   **Check:** Is the answer free of technical jargon?
    *   **✔ Good:** "The tiny bits that make up everything are called atoms. They are like super-duper tiny building blocks!"
    *   **✘ Bad:** "Matter is composed of fundamental particles called atoms, which consist of a nucleus of protons and neutrons surrounded by electrons."
*   **Check:** Does it use a relatable, real-world analogy?
    *   **✔ Good:** "A computer's memory is like your backpack. You can put things in it to remember for later."
    *   **✘ Bad:** "RAM provides short-term data storage for quick access by the processor."
*   **Check:** Is the tone positive and engaging for a child?
    *   **✔ Good:** "Wow, numbers are amazing! Let's count together!"
    *   **✘ Bad:** "This is a basic explanation of arithmetic."

## Failure modes

*   **Mistake:** The AI ignores the Ali5 instructions and answers with complex, technical language.
    *   **Why it happens:** The main System Prompt User Question Retrieved Context|system prompt might be too weak, or the retrieved information from the database is itself highly technical and overwhelms the style instructions.
    *   **How to fix it:** Strengthen the Ali5 persona in the prompt and instruct the model to *rephrase* the found information, not just repeat it. Using an [[RagSystemRoadmap/ExplainAgainButtonReSimplifyResponse.md|Explain Again button]] can also help.
*   **Mistake:** The explanation becomes so simple that it is factually incorrect or misleading.
    *   **Why it happens:** In striving for ultimate simplicity, the AI might omit crucial details or create an analogy that breaks down upon closer inspection.
    *   **How to fix it:** Implement Human Review|human review cycles to check the factual accuracy of common Ali5 answers and refine the prompts accordingly.
*   **Mistake:** The answer is condescending and doesn't respect the user's intelligence.
    *   **Why it happens:** The prompt might over-emphasize "child-like" language, resulting in a tone that feels patronizing to an older user who just prefers simple explanations.
    *   **How to fix it:** Adjust the prompt to focus on "clarity" and "simplicity" rather than just "for a 5-year-old," and encourage a tone that is "friendly" rather than "babyish."

## Examples

*   **Real-World Analogy:** Explaining a **database**.
    *   *Imagine a giant library. Every book has a special code on its spine. The librarian knows exactly where every book is. A database is like that super-smart librarian for information inside a computer. It helps the computer find any piece of information super fast!*
*   **Code Snippet:** Here is a simplified version of what an [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|Ali5 prompt]] might look like in code.
    ````python
    def create_ali5_prompt(user_question, retrieved_context):
        base_instructions = """
        You are Professor Popsicle. Explain the following in a way a 5-year-old would love.
        Rules:
        1. Use words like "super," "cool," "fun," and "amazing."
        2. Compare things to toys, candy, or animals.
        3. Never use words longer than 8 letters if you can avoid it.
        4. Be excited!
        
        Here is some information to use: {retrieved_context}
        
        Now, answer this question: {user_question}
        """
        return base_instructions.format(retrieved_context=retrieved_context, user_question=user_question)
    ````

## Advanced notes

*   The Ali5 technique is a specific type of **persona-based prompting**, where you assign a detailed role to the AI to control the style and content of its output.
*   For even better results, this mode can be combined with [[RagSystemRoadmap/AddShortFriendlyExamples.md|short, friendly examples]] that are stored in the system and inserted into the prompt when relevant.
*   The effectiveness of Ali5 mode should be tracked through [[RagSystemRoadmap/Evaluation.md|evaluation]] metrics that measure user satisfaction and comprehension, not just technical accuracy.

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

