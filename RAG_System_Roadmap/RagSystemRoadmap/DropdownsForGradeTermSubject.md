---
id: rag-system-roadmap-frontend-dropdowns-for-grade-term-subject_34a58c7e
type: leaf
parent: RagSystemRoadmap/Frontend.md
children:
prereqs:
  - RagSystemRoadmap/StackReactTailwind.md
  - RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md
  - RagSystemRoadmap/ChatStyleQAInterface.md
  - RagSystemRoadmap/AskHandleQuestionAnswering.md
  - RagSystemRoadmap/DisplayCitationsSourcePage.md
see_also:
  - RagSystemRoadmap/Phase9ContinuousImprovement.md
  - RagSystemRoadmap/Frontend.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
summary: This component provides three cascading dropdown menus in the [[Frontend|UI]] that allow users to filter educational content by grade level, academic term, and subject, which is then used to query the correct [[CreateCollectionsPerSubjectGradeTerm|vector database collection]] for highly relevant, context-specific answers.
model: provider/model
run_id: manual
---

# Dropdowns for Grade/Term/Subject

## Summary

This component provides three cascading dropdown menus in the [[RagSystemRoadmap/Frontend.md|UI]] that allow users to filter educational content by grade level, academic term, and subject, which is then used to query the correct [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|vector database collection]] for highly relevant, context-specific answers.

## Key concepts

*   **Cascading Dropdowns**: A user interface pattern where the options in one dropdown menu determine the available options in the next. This creates a guided, step-by-step filtering experience.
    *   *Example*: Selecting "Grade 10" in the first dropdown populates the "Term" dropdown with "Semester 1" and "Semester 2," and selecting "Semester 1" then populates the "Subject" dropdown with "Physics," "Chemistry," etc.
*   **Metadata Filtering**: The selected values from the dropdowns are not part of the search query itself but are used as filters on the document's metadata during the [[RagSystemRoadmap/SemanticSearch.md|semantic search]] process in [[RagSystemRoadmap/DatabaseQdrant.md|Qdrant]].
    *   *Example*: When a user asks "What is Newton's first law?" and has selected "Grade 10 / Semester 1 / Physics," the system searches for the answer *only* within chunks of text that have the corresponding `grade`, `term`, and `subject` metadata.
*   **Collection Selection**: In our system architecture, each unique combination of grade, term, and subject has its own [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|dedicated collection]] in the vector database. The dropdowns are the primary mechanism for selecting the target collection for a query.
    *   *Example*: The frontend sends the selected values to the [[RagSystemRoadmap/Backend.md|backend]] [[RagSystemRoadmap/ApiFastapi.md|API]], which uses them to form a request to the specific Qdrant collection named `grade_10_term_1_physics`.

## Why it matters

*   **Dramatically Improves Retrieval Accuracy**: By restricting the search to a highly specific, pre-defined context, the system avoids returning irrelevant information from other grades or subjects, which is critical for factually correct answers in an educational setting.
    *   *Analogy*: It's the difference between searching for "cell" in a massive, unorganized library versus going directly to the "Grade 9 Biology" textbook; you get the right context immediately.
*   **Structured User Guidance**: It simplifies the user experience by breaking down a complex information space (all educational content) into manageable, logical choices, preventing users from feeling overwhelmed.
*   **Enables Fine-Tuned Knowledge Bases**: This structure is a prerequisite for creating the [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|separate, optimized collections]] in the first place, making the entire [[RagSystemRoadmap/RagSystemRoadmap.md|RAG system]] more scalable and performant.

## Core steps

*   **Render Cascading Select Elements**: Build the UI with three `<select>` elements using [[RagSystemRoadmap/StackReactTailwind.md|React and Tailwind CSS]], where the state of one controls the options of the next to ensure logical consistency.
    *   *Reason*: To guide the user and prevent invalid combinations (e.g., "Kindergarten Calculus").
    *   *Example*:
        ````jsx
        // State to hold selected values and available options
        const [selectedGrade, setSelectedGrade] = useState('');
        const [availableTerms, setAvailableTerms] = useState([]);
        const [selectedTerm, setSelectedTerm] = useState('');
        // ... more state for subjects

        // Effect to update available terms when grade changes
        useEffect(() => {
          if (selectedGrade) {
            // Fetch terms for the selected grade from an API or a local map
            const termsForGrade = getTermsForGrade(selectedGrade);
            setAvailableTerms(termsForGrade);
            setSelectedTerm(''); // Reset term selection
          }
        }, [selectedGrade]);
        ````
*   **Capture Selections as Metadata Filters**: When a user submits a question, package the selected `grade`, `term`, and `subject` values into a filter object to be sent with the query to the [[RagSystemRoadmap/Backend.md|backend]].
    *   *Reason*: The [[RagSystemRoadmap/Backend.md|backend]] needs this filter to search within the correct subset of data in the vector database.
    *   *Example*:
        ````jsx
        const handleQuestionSubmit = (userQuestion) => {
          const payload = {
            question: userQuestion,
            filters: {
              grade: selectedGrade,
              term: selectedTerm,
              subject: selectedSubject,
            }
          };
          // Send payload to the AskHandleQuestionAnswering endpoint
          fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          .then(response => response.json())
          .then(data => setAnswer(data.answer));
        };
        ````
*   **Target the Correct Vector Collection**: The [[RagSystemRoadmap/Backend.md|backend]] uses the received filters to construct the name of the target [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|Qdrant collection]] and performs the [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|vector search]] exclusively within it.
    *   *Reason*: Isolating searches to a single, relevant collection is faster and more accurate than filtering a giant, monolithic collection.
    *   *Example*: The backend logic constructs a collection name like `f"grade_{grade}_term_{term}_subject_{subject}"` and uses it in the Qdrant client's query.

## Checks

*   ✔ **Does selecting a grade immediately update the list of available terms?**
    *   ✔ *Good*: Selecting "Grade 5" populates the Term dropdown with "Quarter 1," "Quarter 2," etc.
    *   ✘ *Bad*: The Term dropdown remains empty or shows terms for a previously selected grade.
*   ✔ **Is an empty subject selection enforced if no term is selected?**
    *   ✔ *Good*: The Subject dropdown is disabled and cleared when the Term dropdown is empty.
    *   ✘ *Bad*: A user can select a subject without first selecting a term, leading to an ambiguous query.
*   ✔ **Does the API request include the filter object in the correct format?**
    *   ✔ *Good*: The payload sent to `/api/ask` contains `{ question: "...", filters: { grade: "10", term: "1", subject: "math" } }`.
    *   ✘ *Bad*: The filters are missing, incorrectly named, or contain invalid values.

## Failure modes

*   **Desynchronized Dropdown Options**: The frontend shows a subject that doesn't actually exist in the backend's database for the selected grade and term.
    *   *Why it happens*: The list of options in the frontend is hard-coded or out-of-sync with the [[RagSystemRoadmap/CreateCollectionsPerSubjectGradeTerm.md|collections]] that were actually created during the data ingestion phase.
    *   *How to fix it*: Drive the dropdown options from a central API endpoint that returns only the grade/term/subject combinations for which valid collections exist.
*   **Ignoring Filters on the Backend**: The backend receives the filters but doesn't use them, searching the entire database instead of the targeted collection.
    *   *Why it happens*: A bug in the [[RagSystemRoadmap/AskHandleQuestionAnswering.md|question-answering endpoint]] where the collection name is hard-coded or the filter parameters are not properly parsed and applied.
    *   *How to fix it*: Implement rigorous backend logging to confirm the target collection name is being correctly constructed from the incoming filters before executing the search.
*   **Poor Default State Handling**: On the initial page load, the dropdowns are in an invalid state (e.g., a term is pre-selected without a grade), which can cause API errors.
    *   *Why it happens*: The UI component's initial state is not properly managed, allowing nonsensical combinations to be submitted.
    *   *How to fix it*: Initialize all selections as empty and disable the dependent dropdowns (Term and Subject) until a valid parent value is selected. Also, disable the "Ask" button until all three filters are selected.

## Examples

*   **Real-World Analogy**: Think of the dropdowns like a filing cabinet for a school. The "Grade" is the cabinet number (e.g., Cabinet 10), the "Term" is the drawer within that cabinet (e.g., Drawer 1), and the "Subject" is the specific folder in that drawer (e.g., Folder: Physics). To find a worksheet on optics, you wouldn't look in Cabinet 3 (Grade 3) or in the "History" folder; you'd go directly to Cabinet 10, Drawer 1, Folder: Physics. These dropdowns automate that "filing cabinet navigation" for the RAG system.
*   **Code Snippet for Filter Integration**: The following pseudo-code shows how the backend might use the filters to select a collection.
    ````python
    # Backend (FastAPI) endpoint snippet
    @app.post("/api/ask")
    async def ask_question(request: Request):
        data = await request.json()
        question = data.get("question")
        filters = data.get("filters", {})
        
        # Construct collection name from filters
        collection_name = f"grade_{filters['grade']}_term_{filters['term']}_subject_{filters['subject']}"
        
        # Query the specific collection
        results = qdrant_client.search(
            collection_name=collection_name,
            query_vector=embed_query(question), # [[RagSystemRoadmap/EmbedUserQuery.md|Embed the user query]]
            limit=5
        )
        # ... proceed to [[RagSystemRoadmap/BuildUnifiedContext.md|build context]] and generate an answer
    ````

## Advanced notes

*   For a more dynamic system, the available options for these dropdowns could be fetched from the [[RagSystemRoadmap/Backend.md|backend]] API, which in turn reads them from the [[RagSystemRoadmap/DatabaseQdrant.md|Qdrant]] cluster's [[RagSystemRoadmap/VerifyCollectionsWithGetCollections.md|list of existing collections]]. This ensures the UI is always in sync with the available data.
*   Consider implementing a "dominant subject" fallback using [[RagSystemRoadmap/DominantSubjectFiltering.md]]. If a user doesn't use the dropdowns, the system could attempt to infer the most likely subject from the question itself and apply a filter automatically, though this is less reliable than explicit user selection.
*   The selected filters are prime candidates for [[RagSystemRoadmap/QueryLoggingFeedback.md|query logging]], as they provide crucial context for analyzing user behavior and improving retrieval performance through [[RagSystemRoadmap/HumanReview.md|human review]] and [[RagSystemRoadmap/Evaluation.md|evaluation]].

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

