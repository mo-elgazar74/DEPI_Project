---
id: rag-system-roadmap-evaluation-human-review_63b0deec
type: leaf
parent: RagSystemRoadmap/Evaluation.md
children:
prereqs:
  - RagSystemRoadmap/RetrievalPrecisionKRecallK.md
  - RagSystemRoadmap/GenerationFactualityFluency.md
see_also:
  - RagSystemRoadmap/Evaluation.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: Human review is the manual evaluation process where domain experts assess RAG system outputs for factual accuracy, fluency, and educational value to identify improvement areas that automated metrics might miss.
model: provider/model
run_id: manual
---

# Human review

## Summary
Human review is the manual evaluation process where domain experts assess RAG system outputs for factual accuracy, fluency, and educational value to identify improvement areas that automated metrics might miss.

## Key concepts
- **Expert evaluation**: Subject matter specialists manually review system responses against source materials to catch subtle errors that automated systems overlook, similar to how editors fact-check articles before publication
- **Quality dimensions**: Reviewers assess multiple aspects including factual correctness (alignment with source content), fluency (natural language flow), and educational appropriateness (suitability for target audience)
- **Feedback loop**: Human findings feed directly into system improvements by identifying patterns in failures that inform [[RagSystemRoadmap/Optimization.md]] strategies and [[RagSystemRoadmap/SystemPromptDesign.md]] refinements
- **Gold standard creation**: Human-reviewed responses serve as benchmark examples for training and evaluating automated evaluation systems in [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md]]

## Why it matters
- **Catches nuanced errors**: Humans can identify subtle factual inconsistencies, contextual misunderstandings, and tone issues that automated metrics like [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md]] might miss completely
- **Validates educational value**: Experts can assess whether explanations are genuinely helpful for learning, not just technically correct, ensuring the system meets its [[RagSystemRoadmap/Goal.md]] of being educational
- **Improves trust**: Manual review builds confidence in the system's reliability before deployment, similar to how textbook publishers employ subject experts to verify content accuracy
- **Informs prioritization**: Human feedback helps identify which Failure modes are most critical to address first in the [[RagSystemRoadmap/Phase7EvaluationOptimization.md]] phase

## Core steps
- **Select diverse query samples**: Choose representative questions across different subjects and difficulty levels to ensure comprehensive coverage, using [[RagSystemRoadmap/AnalyticsDashboard.md]] to identify common query patterns
- **Establish rating criteria**: Define clear evaluation rubrics for [[RagSystemRoadmap/GenerationFactualityFluency.md]] with specific benchmarks for what constitutes excellent, acceptable, and poor responses
- **Conduct blind reviews**: Have multiple experts evaluate the same responses independently to measure inter-rater reliability and reduce individual bias
- **Document findings systematically**: Record specific issues and improvement suggestions in structured format that can be analyzed for patterns

```python
# Example human review data structure
review_record = {
    "query": "Explain photosynthesis to a 5th grader",
    "system_response": "...",
    "source_documents": ["...", "..."],
    "ratings": {
        "factual_accuracy": 4,  # 1-5 scale
        "fluency": 3,
        "educational_value": 5
    },
    "issues_found": ["Oversimplified chloroplast function", "Missing gas exchange explanation"],
    "suggested_improvements": ["Add analogy for chloroplast as kitchen", "Include simple diagram description"]
}
```

## Checks
- ✔ **Does the response stay faithful to the retrieved context?** Example: When asked about animal classification, response correctly uses taxonomy information from source documents rather than general knowledge
- ✘ **Does the response invent information not present in sources?** Example: Adding specific dates or statistics that weren't in the retrieved [[RagSystemRoadmap/ContextConstruction.md]]
- ✔ **Is the explanation appropriately simplified for the target audience?** Example: Using "energy factory" instead of "ATP synthesis" for [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md]] mode
- ✘ **Does technical jargon creep in where simple explanations would suffice?** Example: Using "photosynthetic phosphorylation" instead of "making energy from sunlight"

## Failure modes
- **Inconsistent rating standards**: Different reviewers applying different criteria leads to unreliable feedback, which happens when evaluation rubrics are too vague - fix by creating detailed scoring guidelines with clear examples for each quality level
- **Sampling bias**: Only reviewing easy or common queries misses edge cases and difficult scenarios, occurring when sample selection isn't stratified by query type - address by systematically sampling from [[RagSystemRoadmap/QueryLoggingFeedback.md]] across difficulty levels and subjects
- **Feedback delay**: Long review cycles prevent timely improvements, happening when review process isn't integrated into development workflow - solve by establishing regular review sprints as part of [[RagSystemRoadmap/Phase9ContinuousImprovement.md]]

## Examples
- **Editorial review analogy**: Just as newspaper editors fact-check articles against source materials and assess readability for their audience, human reviewers verify RAG responses against retrieved documents and evaluate educational appropriateness
- **Code implementation**: The review interface can integrate directly with the [[RagSystemRoadmap/ChatStyleQAInterface.md]] to streamline the evaluation process

```python
# Integrated review interface component
def display_for_review(question, response, sources):
    return {
        "question": question,
        "response": response,
        "sources": sources,
        "rating_interface": {
            "factuality_slider": (1, 5),
            "fluency_buttons": ["Poor", "Fair", "Good", "Excellent"],
            "issue_tags": ["Hallucination", "Incomplete", "Too technical", "Off-topic"]
        }
    }
```

## Advanced notes
- **Calibration sessions**: Regular meetings where reviewers discuss borderline cases to align scoring standards, similar to how search quality raters calibrate across Google's evaluation teams
- **Disagreement analysis**: Systematically examining cases where reviewers disagree often reveals ambiguous system behaviors or unclear evaluation criteria that need refinement
- **Progressive refinement**: Start with broad quality dimensions, then develop increasingly specific evaluation criteria as understanding of system capabilities and failure patterns deepens through [[RagSystemRoadmap/Phase7EvaluationOptimization.md]]
- **Integration with automated eval**: Use human-reviewed examples as training data for [[RagSystemRoadmap/EvaluationLangfuseCustomScripts.md]] to create more sophisticated automated evaluation metrics that approximate human judgment

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

