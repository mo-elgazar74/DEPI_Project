---
id: rag-system-roadmap-system-prompt-design-add-short-friendly-examples_6542c748
type: leaf
parent: RagSystemRoadmap/SystemPromptDesign.md
children:
prereqs:
  - RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md
  - RagSystemRoadmap/AnswerOnlyFromContext.md
  - RagSystemRoadmap/SameLanguageAsQuestion.md
  - RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md
see_also:
  - RagSystemRoadmap/SystemPromptDesign.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: Including brief, relatable examples within your system prompt dramatically improves the AI's ability to understand and follow complex instructions by providing concrete patterns it can recognize and emulate.
model: provider/model
run_id: manual
---

# Add short, friendly examples

## Summary
Including brief, relatable examples within your system prompt dramatically improves the AI's ability to understand and follow complex instructions by providing concrete patterns it can recognize and emulate.

## Key concepts
- **Demonstration learning**: Providing worked examples helps the AI recognize the pattern you want it to follow, similar to showing a student sample essays before asking them to write their own
- **Pattern recognition**: The AI identifies the structure, tone, and approach in your examples and applies similar patterns to new queries
- **Concrete anchoring**: Examples ground abstract instructions in real-world scenarios, making them more actionable for the AI
- **Multi-format coverage**: Different question types need different example formats, from simple Q&A to complex reasoning chains

## Why it matters
- **Reduces ambiguity**: Examples clarify exactly what you mean by "friendly" or "simple" in practice
- **Improves consistency**: When the AI sees multiple examples of the desired style, it maintains that style more reliably across different queries
- **Saves tokens**: Well-chosen examples can replace lengthy explanatory text while being more effective
- **Handles edge cases**: You can demonstrate how to handle missing information, complex questions, or confusing inputs

## Core steps
- **Analyze common query patterns** to identify which question types need example coverage, then create examples that match your most frequent user scenarios
  ```python
  # Example: Mapping query types to example needs
  query_patterns = {
    "factual": "What is photosynthesis?",
    "comparative": "How do mammals differ from reptiles?", 
    "procedural": "Explain how to solve 2x + 5 = 15",
    "complex": "Why do seasons change and how does it affect animal behavior?"
  }
  ```

- **Create varied but consistent examples** that show different question types while maintaining the same response style, ensuring each example demonstrates your core principles like [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md]] or [[RagSystemRoadmap/AnswerOnlyFromContext.md]]
  ```markdown
  Example 1 (simple fact):
  User: What is gravity?
  AI: Gravity is like an invisible force that pulls everything toward the ground. It's why when you drop a ball, it falls down instead of floating away!
  
  Example 2 (comparison):  
  User: What's the difference between lakes and oceans?
  AI: Think of a lake as a small bathtub and an ocean as a giant swimming pool that covers most of the Earth! Lakes are surrounded by land, while oceans are much, much bigger and saltier.
  ```

- **Place examples strategically** within your prompt structure, typically after the core instructions but before any additional constraints or formatting rules
  ```markdown
  # System Prompt Structure:
  1. Core role definition
  2. Key instructions (be friendly, use simple language)
  3. EXAMPLES SECTION
  4. Formatting rules
  5. Safety constraints
  ```

- **Test and iterate** based on actual user queries, adding examples for question types that consistently produce poor responses and removing redundant examples that don't improve performance

## Checks
- ✔ Do your examples cover your most common question types?
- ✔ Can someone unfamiliar with AI prompting understand what response style you want just by reading the examples?
- ✘ Are your examples too similar to each other (all simple facts, no complex questions)?
- ✘ Do examples contradict your main instructions (showing long responses when you asked for brief ones)?

## Failure modes
- **Over-specific examples** that only work for exact matches: This happens when examples are too narrow, so the AI fails with similar but different questions. Fix by using broader patterns that teach transferable skills.
- **Conflicting style signals** between instructions and examples: When you say "be concise" but show verbose examples, the AI follows the examples. Ensure your examples perfectly demonstrate what your instructions describe.
- **Example bloat** that makes the prompt unwieldy: Adding too many examples can confuse the AI and consume valuable context window. Limit to 3-5 high-quality examples that cover your main use cases.

## Examples
- **Real-world analogy**: Teaching someone to cook by showing them 2-3 complete recipes works better than just explaining cooking techniques—they see the whole process from start to finish and understand how techniques combine
- **Code example for a tutoring system**:
  ```markdown
  ## Response Examples:
  
  SCIENCE QUESTION:
  User: Why is the sky blue?
  AI: Great question! Sunlight looks white but it's actually made of all colors like a rainbow. Blue light bounces around more in our atmosphere, so that's what we see most. It's like when you shine a white light through blue glass - everything looks blue!
  
  MATH QUESTION:  
  User: How do I find the area of a circle?
  AI: Let's think of pizza! The area is how much space the pizza covers. We use a special formula: π × r². If the radius (r) is 4 inches, we do 3.14 × 4 × 4 = 50.24 square inches of delicious pizza!
  
  HISTORY QUESTION:
  User: What was the Industrial Revolution?
  AI: Imagine going from making things slowly by hand to having amazing machines that could make hundreds of items quickly! That's what happened starting around 1760 - factories, trains, and new inventions changed how people lived and worked.
  ```

## Advanced notes
- **Progressive difficulty** in examples helps the AI handle both simple and complex queries—start with basic facts, then add multi-step reasoning, finally include examples showing how to say "I don't know" when [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md]]
- **Domain-specific examples** are crucial for specialized systems—medical, legal, or technical domains need examples that demonstrate proper terminology use and reasoning patterns specific to that field
- **Example rotation** based on [[RagSystemRoadmap/AnalyticsDashboard.md]] data can optimize performance—if you notice certain question types consistently underperforming, add targeted examples for those patterns
- **Cross-lingual examples** help with [[RagSystemRoadmap/SameLanguageAsQuestion.md]] implementation by showing how to maintain style while switching languages within the same interaction

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

