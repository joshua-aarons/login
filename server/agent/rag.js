import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { loadKnowledgeDocuments } from "../knowledge.js";

/**
 * LangChain-native RAG (Retrieval-Augmented Generation) system.
 * Uses MemoryVectorStore and OpenAIEmbeddings for document retrieval.
 */

let vectorStore = null;

/**
 * Initializes the vector store by loading and indexing documents.
 */
export async function initializeVectorStore() {
  if (vectorStore) return vectorStore;

  const docs = await loadKnowledgeDocuments();
  if (docs.length === 0) {
    console.warn("No documents found to initialize vector store.");
    return null;
  }

  // Use OpenAIEmbeddings via OpenRouter
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    modelName: "openai/text-embedding-3-small", // or any compatible model
  });

  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return vectorStore;
}

/**
 * Retrieve relevant documentation for a query.
 * @param {string} query - User question
 * @param {number} [topK=3] - Max chunks to return
 * @returns {Promise<string>} Concatenated context for LLM prompt
 */
export async function retrieve(query, topK = 3) {
  const store = await initializeVectorStore();
  if (!store) return "";

  const results = await store.similaritySearch(query, topK);
  return results.map((doc) => doc.pageContent).join("\n\n");
}
