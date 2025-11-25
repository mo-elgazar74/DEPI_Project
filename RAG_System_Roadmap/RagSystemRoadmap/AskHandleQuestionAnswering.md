---
id: rag-system-roadmap-backend-endpoints-ask-handle-question-answering_3fa63657
type: leaf
parent: RagSystemRoadmap/Endpoints.md
children:
prereqs:
  - RagSystemRoadmap/Endpoints.md
  - RagSystemRoadmap/SemanticSearch.md
  - RagSystemRoadmap/ContextConstruction.md
  - RagSystemRoadmap/SystemPromptDesign.md
  - RagSystemRoadmap/GeneratorGroqOpenaiMistral.md
see_also:
  - RagSystemRoadmap/IndexAddNewDocuments.md
  - RagSystemRoadmap/EvalRunBenchmarks.md
summary: This endpoint processes a user's question by finding the most relevant information from a pre-processed knowledge base using semantic search and then generating a clear, educational answer using a large language model.
model: provider/model
run_id: manual
---

# `/ask` – handle question answering

## Summary
This endpoint processes a user's question by finding the most relevant information from a pre-processed knowledge base using semantic search and then generating a clear, educational answer using a large language model.

## Key concepts
*   **Semantic Search**: This is the process of finding text based on meaning, not just keywords. The system converts both the user's question and the knowledge base text into numerical representations called vectors to find the best matches.
    *   *Example*: A search for "how plants make food" would also find passages about "photosynthesis," even if that exact word wasn't used.
*   **Context Construction**: This is the step of gathering the top search results and combining them into a single block of text, which provides the "evidence" for the answer.
    *   *Example*: It's like a student gathering the 3 most relevant paragraphs from their textbook notes before writing an essay answer.
*   **Prompt Engineering**: This involves carefully designing the instructions (the prompt) given to the language model to ensure it generates answers in a specific style and format.
    *   *Example*: The prompt tells the model to "Explain like the user is 5 years old," use only the provided context, and cite its sources.

## Why it matters
*   It is the core user-facing feature of the RAG system, directly fulfilling the primary goal of answering educational questions.
*   By grounding answers in the provided context, it significantly reduces the chance of the model inventing false information (a problem known as "hallucination").
*   The modular design allows for independent improvement of its components, such as the [[RagSystemRoadmap/EmbeddingGeneration.md|embedding model]] or the [[RagSystemRoadmap/GeneratorGroqOpenaiMistral.md|LLM generator]].

## Core steps
*   **Embed the user's query** to transform the question into a vector, enabling a mathematical comparison against the knowledge base vectors.
    *   *Reason*: This converts the question into the same "language" (vector space) as the stored document chunks for an apples-to-apples comparison.
    *   *Example*: `query_vector = embed_model.encode("What is photosynthesis?")`
*   **Query the vector database** with the generated query vector to retrieve the most semantically similar text chunks.
    *   *Reason*: To find the factual information needed to construct an accurate answer.
    *   *Example*: Using [[RagSystemRoadmap/QdrantSetup.md|Qdrant's]] search API: `client.search(collection_name="science", query_vector=query_vector, limit=5)`
*   **Build a unified context** by combining the text from the top retrieved chunks into a single, coherent string.
    *   *Reason*: The language model needs all relevant information presented together to generate a well-informed and comprehensive answer.
    *   *Example*: `final_context = "\n".join([chunk.text for chunk in top_chunks])`
*   **Compose and send the generation prompt** that includes the unified context, the original question, and specific instructions for the LLM.
    *   *Reason*: To guide the LLM to produce an answer that is factual (based on the context), fluent, and matches the desired style (e.g., [[RagSystemRoadmap/Ali5ModeExplainLikeToA5YearOld.md|ALI5 mode]]).
    *   *Example*:
        ````python
        prompt = f"""
        Context: {final_context}
        Question: {user_question}
        Instruction: Answer the question using only the context above. If the information is not available, say so. Explain simply.
        Answer:
        """
        ````
*   **Return the generated answer and citations** to the user, providing both the final response and the source of the information for verification.
    *   *Reason*: Builds trust and allows users to explore the source material.
    *   *Example*: The JSON response includes `answer` and `sources` fields, where sources are the [[RagSystemRoadmap/SaveChunkIdPageAndSource.md|metadata]] from the retrieved chunks.

## Checks
*   ✔ **Does the answer directly address the question asked?**
    *   ✔ "What is gravity?" -> "Gravity is a force that pulls objects towards each other..."
    *   ✘ "What is gravity?" -> "Isaac Newton was a famous scientist who discovered many things."
*   ✔ **Is the answer grounded in the provided context and not external knowledge?**
    *   ✔ Answer includes facts found in the retrieved chunks.
    *   ✘ Answer introduces a fact not present in any retrieved source.
*   ✔ **When the context is empty or irrelevant, does the system correctly state that it doesn't know?**
    *   ✔ "The provided documents do not contain information about quantum computing."
    *   ✘ It fabricates an answer about quantum computing despite having no sources.

## Failure modes
*   **Mistake**: The answer is generic or hallucinates information.
    *   **Why**: The retrieved context was poor, or the system prompt did not strongly enforce the "[[RagSystemRoadmap/AnswerOnlyFromContext.md|answer only from context]]" rule.
    *   **Fix**: Improve [[RagSystemRoadmap/SemanticSearch.md|semantic search]] quality by tuning [[RagSystemRoadmap/ChunkingMethods.md|chunking]] or the [[RagSystemRoadmap/EmbeddingHuggingfaceMultilingualE5Small.md|embedding model]], and strengthen the [[RagSystemRoadmap/SystemPromptDesign.md|system prompt]].
*   **Mistake**: The response is slow, leading to a poor user experience.
    *   **Why**: Sequential operations (embed, search, generate) or high latency from the LLM API.
    *   **Fix**: Implement [[RagSystemRoadmap/AsyncSearchForSpeed.md|asynchronous operations]] and consider [[RagSystemRoadmap/CacheFrequentQueriesRedis.md|caching]] for frequent queries.
*   **Mistake**: The answer is technically correct but too complex for the target audience (e.g., a young student).
    *   **Why**: The [[RagSystemRoadmap/PromptingCustomAli5EducationalSystemPrompt.md|educational system prompt]] was not correctly applied or was overridden.
    *   **Fix**: Review the prompt composition logic and ensure the instructional part is always included and formatted correctly.

## Examples
*   **Real-world Analogy**: Imagine a teaching assistant who is given a student's question. Instead of relying on their own memory, they quickly look through a well-organized filing cabinet (the [[RagSystemRoadmap/BuildFastSemanticSearchDatabase.md|vector database]]) to pull out the most relevant textbook pages (the [[RagSystemRoadmap/ContextConstruction.md|context]]). They then read those pages and write a summary answer for the student, citing which pages the information came from.
*   **Code Snippet**: A simplified view of the endpoint logic.
    ````python
    from qdrant_client import QdrantClient
    from generators import GroqGenerator
    
    @app.post("/ask")
    async def ask_question(request: QuestionRequest):
        # 1. Embed Query
        query_vector = embed_model.encode(request.question)
        
        # 2. Search Database
        client = QdrantClient()
        search_results = client.search(
            collection_name=request.subject,
            query_vector=query_vector,
            limit=5
        )
        
        # 3. Build Context
        context = build_unified_context(search_results)
        
        # 4. Generate Answer
        generator = GroqGenerator()
        answer = generator.generate(context, request.question)
        
        # 5. Return with sources
        return {
            "answer": answer,
            "sources": [hit.payload for hit in search_results]
        }
    ````

## Advanced notes
*   For higher accuracy, consider implementing [[RagSystemRoadmap/HybridSearchBm25Embeddings.md|hybrid search]], which combines semantic search with traditional keyword matching (BM25) to catch relevant passages that might use different terminology.
*   A [[RagSystemRoadmap/OptionallyRerankResults.md|reranking step]] can be added after the initial search, using a more powerful (but slower) model to re-sort the top results for better precision.
*   The entire pipeline, from query to final answer, should be [[RagSystemRoadmap/QueryLoggingFeedback.md|logged]] for [[RagSystemRoadmap/Evaluation.md|evaluation]] and ContinuousImprovement|continuous improvement, allowing you to track metrics like [[RagSystemRoadmap/RetrievalPrecisionKRecallK.md|retrieval precision]] and [[RagSystemRoadmap/GenerationFactualityFluency.md|generation factuality]].

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

