---
id: rag-system-roadmap-evaluation-langfuse-custom-scripts_fad0cc5a
type: leaf
parent: RagSystemRoadmap/RagSystemRoadmap.md
children:
prereqs:
  - RagSystemRoadmap/Evaluation.md
  - RagSystemRoadmap/QueryLoggingFeedback.md
  - RagSystemRoadmap/RetrieverLlamaindexLangchain.md
  - RagSystemRoadmap/GeneratorGroqOpenaiMistral.md
  - RagSystemRoadmap/Phase1DataLayerKnowledgeIngestion.md
see_also:
  - RagSystemRoadmap/PdfTextExtraction.md
  - RagSystemRoadmap/TextCleaning.md
  - RagSystemRoadmap/ChunkingMethods.md
  - RagSystemRoadmap/Tips.md
  - RagSystemRoadmap/EmbeddingGeneration.md
summary: This phase systematically measures your RAG system's performance using Langfuse for automated tracking and custom scripts for tailored metrics, enabling data-driven improvements to retrieval accuracy and answer quality.
model: provider/model
run_id: manual
---

# **Evaluation:** Langfuse, custom scripts

## Summary
This phase systematically measures your RAG system's performance using Langfuse for automated tracking and custom scripts for tailored metrics, enabling data-driven improvements to retrieval accuracy and answer quality.

## Key concepts
- **Langfuse**: An open-source platform that acts as a flight recorder for your LLM application, automatically logging traces, spans, and events to monitor system performance.
  - *Example*: Like a black box in an airplane, it records every interaction—user queries, retrieved contexts, and generated answers—for later analysis.
- **Custom evaluation scripts**: Python code you write to calculate specific metrics that matter for your educational use case, beyond what standard tools provide.
  - *Example*: A script that checks if answers to math questions preserve the original diagram references from the textbook context.
- **Retrieval precision/recall**: Precision measures how many of the retrieved chunks are actually relevant, while recall measures how many of the relevant chunks were successfully retrieved.
  - *Example*: If there are 5 relevant chunks about photosynthesis in your database, and your system retrieves 3 of them (with 2 being irrelevant), precision is 60% and recall is 60%.

## Why it matters
- **Identifies weak points** in your pipeline without guessing—data shows exactly where improvements are needed most.
  - *Example*: Evaluation might reveal that your [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md]] struggles with Arabic scientific terms, prompting you to consider [[RagSystemRoadmap/FineTunedEmbeddingsForArabicDomain.md]].
- **Enables objective comparison** between different configurations when you're testing improvements like [[RagSystemRoadmap/HybridSearchBm25Embeddings.md]] or [[RagSystemRoadmap/AdjustChunkSize.md]].
- **Provides evidence for stakeholders** that your [[RagSystemRoadmap/RagSystemRoadmap.md]] is delivering value and where investment should be directed.
- **Creates feedback loop** for ContinuousImprovement by connecting [[RagSystemRoadmap/QueryLoggingFeedback.md]] to measurable performance metrics.

## Core steps
- **Instrument your pipeline with Langfuse** to automatically capture traces of each question-answer interaction, including the user query, retrieved chunks, and final response.
  - *Reason*: Manual logging is error-prone and doesn't scale; automated capture ensures comprehensive data for analysis.
  - *Example*:
  ```python
  from langfuse import Langfuse
  langfuse = Langfuse()
  
  trace = langfuse.trace(
      name="qa-interaction",
      input=user_question,
      output=final_answer
  )
  ```
- **Define custom evaluation metrics** specific to your educational domain that measure aspects like factual accuracy, completeness, and age-appropriate explanation quality.
  - *Reason*: Generic metrics don't capture educational effectiveness; you need to measure what matters for student learning.
  - *Example*: A metric that checks if the answer uses the [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md]] approach when the question comes from an elementary student.
- **Run batch evaluations** using your [[RagSystemRoadmap/EvalRunBenchmarks.md]] on a curated set of test questions with known good answers to establish baseline performance.
  - *Reason*: Spot testing gives unreliable results; systematic evaluation across diverse questions provides statistical significance.
  - *Example*: A script that processes 100 test questions through your system and compares generated answers to expert-written reference answers.
- **Analyze results by component** to pinpoint whether issues originate in retrieval, generation, or other parts of your pipeline.
  - *Reason*: Knowing "the system is 70% accurate" isn't actionable; knowing "retrieval fails for 30% of science questions" is.
  - *Example*: Separate analysis of [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]] versus [[RagSystemRoadmap/GenerationFactualityFluency.md]] to identify which phase needs optimization.

## Checks
- **Are your evaluation metrics detecting real user problems?**
  - ✔ Metric decreases when you test with ambiguous questions that typically confuse the system
  - ✘ All metrics look perfect but users still complain about answer quality
- **Is Langfuse capturing all the data you need for analysis?**
  - ✔ You can reconstruct the exact retrieval and generation process for any failed query
  - ✘ Missing information about which chunks were retrieved or what prompt was used
- **Can you correlate performance changes with specific deployments?**
  - ✔ You notice precision dropped 15% after changing from [[RagSystemRoadmap/FixedLength400600Tokens.md]] to [[RagSystemRoadmap/SemanticChunkingSplitByTopicSimilarity.md]]
  - ✘ Performance varies mysteriously and you can't trace it to any system change

## Failure modes
- **Evaluating with irrelevant metrics** that don't align with your educational goals
  - *Why it happens*: Using generic LLM evaluation frameworks without adapting them to your specific [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md]] requirements
  - *How to fix*: Start with user feedback and work backward to define metrics that actually measure educational effectiveness
- **Overfitting to your test set** by repeatedly tuning based on the same evaluation questions
  - *Why it happens*: The test questions become familiar during development, and the system learns to answer them well while performing poorly on new questions
  - *How to fix*: Maintain separate development, validation, and test sets, and only use the test set for final evaluation
- **Ignoring computational costs** of comprehensive evaluation that makes iteration painfully slow
  - *Why it happens*: Running full [[RagSystemRoadmap/Evaluation.md]] with Langfuse tracking on large test sets can take hours or days
  - *How to fix*: Create a lightweight smoke test with critical test cases for quick iteration, saving full evaluation for major milestones

## Examples
- **Restaurant quality inspection analogy**: Just as a restaurant owner might track both automated metrics (food preparation time, order accuracy) and custom quality checks (taste tests, presentation evaluation), you use Langfuse for automated logging and custom scripts for educational quality assessment.
- **Custom metric for answer completeness**:
  ```python
  def evaluate_answer_completeness(question, retrieved_chunks, answer):
      # Check if answer addresses all key aspects mentioned in relevant chunks
      required_concepts = extract_key_concepts(retrieved_chunks)
      covered_concepts = identify_concepts_in_answer(answer)
      completeness_score = len(covered_concepts) / len(required_concepts)
      return completeness_score
  ```
  This script ensures answers don't omit important information from the retrieved context, addressing the [[RagSystemRoadmap/IfInfoMissingSayTheInformationIsNotAvailable.md]] requirement.

## Advanced notes
- **Implement progressive evaluation** where you start with basic metrics and gradually add more sophisticated measurements as your system matures
  - *Example*: Begin with retrieval accuracy, then add [[RagSystemRoadmap/GenerationFactualityFluency.md]], then incorporate [[RagSystemRoadmap/HumanReview.md]] for subtle educational quality aspects
- **Create evaluation dashboards** that combine Langfuse data with your custom metrics to provide comprehensive visibility into system health
  - *Example*: An [[RagSystemRoadmap/AnalyticsDashboard.md]] that shows daily trends in both automated scores and manually-rated answer quality
- **Design evaluation for A/B testing** different approaches like comparing [[RagSystemRoadmap/HybridSearchBm25Embeddings.md]] against pure [[RagSystemRoadmap/SemanticSearch.md]] using statistical significance testing
  - *Example*: Running both retrieval methods on the same question set and using paired t-tests to determine if performance differences are meaningful

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

