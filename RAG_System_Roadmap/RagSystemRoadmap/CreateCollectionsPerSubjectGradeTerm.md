---
id: rag-system-roadmap-qdrant-setup-create-collections-per-subject-grade-term_39cba368
type: leaf
parent: RagSystemRoadmap/QdrantSetup.md
children:
prereqs:
  - RagSystemRoadmap/DistanceCosineVectorSize384.md
  - RagSystemRoadmap/UpsertPointsIdVectorPayload.md
  - RagSystemRoadmap/VerifyCollectionsWithGetCollections.md
  - RagSystemRoadmap/VectorMetadataSourcePageSubject.md
  - RagSystemRoadmap/BuildFastSemanticSearchDatabase.md
see_also:
  - RagSystemRoadmap/QdrantSetup.md
  - RagSystemRoadmap/ToolsPymupdfTesseractSpacy.md
  - RagSystemRoadmap/ExtractTextFromBooksAndScannedPdfs.md
  - RagSystemRoadmap/OcrFallbackForImagePages.md
  - RagSystemRoadmap/DetectMathSymbolsAndDiagrams.md
summary: Create separate vector database collections for each unique combination of subject, grade level, and academic term to organize educational content and enable precise semantic search within relevant contexts.
model: provider/model
run_id: manual
---

# Create collections per subject/grade/term

## Summary
Create separate vector database collections for each unique combination of subject, grade level, and academic term to organize educational content and enable precise semantic search within relevant contexts.

## Key concepts
- **Collections** are isolated namespaces in [[RagSystemRoadmap/DatabaseQdrant.md|Qdrant]] that store vectors with similar characteristics, like separate filing cabinets for different topics.
- **Subject-grade-term partitioning** creates logical boundaries between educational content that have different learning objectives and vocabulary complexity.
- **Metadata filtering** uses collection structure to pre-filter search results, similar to searching only in the "math" section of a library instead of the entire building.
- **Vector isolation** ensures that 5th grade science vectors don't get mixed with 10th grade physics vectors, maintaining search relevance.

## Why it matters
- **Precision targeting** ensures students get age-appropriate explanations without overwhelming them with advanced concepts from higher grades.
- **Performance optimization** reduces search space dramatically - searching through 10,000 math vectors instead of 1,000,000 total educational vectors.
- **Content organization** mirrors real-world educational structure, making it intuitive for teachers and curriculum designers to manage content.
- **Scalable maintenance** allows updating 8th grade history content without affecting 3rd grade reading materials or requiring full database reindexing.

## Core steps
- **Define collection naming convention** to ensure consistent, predictable collection identifiers across the system using standardized patterns.
  ```python
  # Collection name format: subject_grade_term
  collection_name = f"{subject}_{grade}_{term}"  # e.g., "math_grade5_term1"
  ```
- **Create collection with cosine distance** because it works well with normalized embeddings and measures angular similarity rather than absolute distance.
  ```python
  from qdrant_client import QdrantClient
  client.create_collection(
      collection_name=collection_name,
      vectors_config=VectorParams(size=384, distance=Distance.COSINE)
  )
  ```
- **Configure vector size 384** to match the output dimension of our [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|multilingual E5-small embedding model]].
- **Store source and page metadata** with each vector to enable citation tracking and content verification for educational accuracy.
  ```python
  payload = {
      "text": chunk_text,
      "source": textbook_filename, 
      "page": page_number,
      "subject": subject,
      "grade": grade,
      "term": term
  }
  ```

## Checks
- ✔ Collection names follow consistent pattern like "science_grade8_term2"
- ✘ Mixed naming like "gr8_science_T2" and "science-grade-8-term2" causing confusion
- ✔ Each collection returns correct count matching expected document chunks
- ✘ Empty collections or missing expected content from processing pipeline
- ✔ Search within grade 5 math doesn't return grade 10 calculus content
- ✘ Cross-contamination between subjects or grade levels in results

## Failure modes
- **Over-fragmentation** happens when creating too many small collections (like per chapter) instead of logical subject-grade units, causing management overhead and inefficient resource usage. Fix by grouping related content into broader collections that still maintain search precision.
- **Inconsistent naming** occurs when different team members use various formats (camelCase, snake_case, abbreviations) making collection discovery unpredictable. Fix by establishing and enforcing strict naming conventions documented in team guidelines.
- **Missing collection verification** leads to runtime errors when the application tries to query non-existent collections. Fix by implementing pre-flight checks using [[RagSystemRoadmap/VerifyCollectionsWithGetCollections.md|collection verification]] before search operations and during deployment.

## Examples
- **Library analogy**: Imagine a school library organized by subject (math, science, history), then by grade level (elementary, middle, high school shelves), then by semester (current vs. archive). Students automatically go to their grade's section without seeing advanced college-level material.
- **Code implementation** showing collection creation for multiple subjects:
  ```python
  subjects = ["math", "science", "history"]
  grades = ["grade5", "grade6", "grade7"] 
  terms = ["term1", "term2"]
  
  for subject in subjects:
      for grade in grades:
          for term in terms:
              collection_name = f"{subject}_{grade}_{term}"
              # Create collection with 384-dim vectors for cosine similarity
              client.create_collection(collection_name, vectors_config=VectorParams(size=384, distance=Distance.COSINE))
  ```

## Advanced notes
- **Dynamic collection routing** can be implemented where the [[RagSystemRoadmap/Frontend.md|UI dropdowns]] for [[RagSystemRoadmap/DropdownsForGradeTermSubject.md|grade, term, subject selection]] directly map to collection names, eliminating need for metadata filtering at query time.
- **Collection lifecycle management** becomes crucial - archive old terms, create new ones each semester, and consider merging rarely accessed collections to optimize storage costs.
- **Cross-collection search** can be enabled for advanced students by querying multiple collections simultaneously, then using [[RagSystemRoadmap/DominantSubjectFiltering.md|subject filtering]] to blend results appropriately.
- **Performance testing** should validate that having 50+ collections (5 subjects × 5 grades × 2 terms) doesn't impact [[RagSystemRoadmap/QueryQdrantForTopKChunks.md|query performance]] compared to a single massive collection.

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

