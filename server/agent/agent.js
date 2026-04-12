/**
 * Squidly LangGraph Agent — StateGraph composition.
 * Drop-in replacement for langchainAgent.js (same return shape).
 *
 * To swap in index.js, change line 20:
 *   // import { runLangChainAgent, planAccountDataSlicesLangChain } from "./agent/langchainAgent.js";
 *   import { runAgent as runLangChainAgent, planAccountDataSlices as planAccountDataSlicesLangChain } from "./agent/agent.js";
 *
 * Graph:
 *   START → classifyIntentNode
 *     ├── (chitchat)      → chitchatNode   → END
 *     ├── (cancel)         → END
 *     └── (plan_execute)   → planNode → retrieveNode
 *           ├── (answer)   → answerNode    → END
 *           └── (action)   → actionNode    → END
 */
import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { traceable } from "langsmith/traceable";
import { agentLog } from "./logger.js";
import { createNodes, routeByIntent, routeExecution } from "./utils/nodes.js";
import { DATA_PLAN_PROMPT } from "./utils/prompts.js";

// ──────────────────────────────────────────────
// Model Factory (shared by all nodes)
// ──────────────────────────────────────────────
export const getModel = (
  temperature = 0.7,
  modelName = "openai/gpt-4o-mini",
) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) console.error("Missing API Key! Check your .env file.");
  return new ChatOpenAI({
    apiKey,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://squidly.ai",
        "X-Title": "Squidly Assistant",
      },
    },
    modelName,
    temperature,
  });
};

// ──────────────────────────────────────────────
// State Schema
// ──────────────────────────────────────────────
const AgentState = Annotation.Root({
  // Input (set once at invocation)
  messages: Annotation({ reducer: (_, v) => v, default: () => [] }),
  input: Annotation({ reducer: (_, v) => v, default: () => "" }),
  accountContext: Annotation({ reducer: (_, v) => v, default: () => "" }),

  // Intermediate (set by nodes)
  intent: Annotation({ reducer: (_, v) => v, default: () => "" }),
  plan: Annotation({ reducer: (_, v) => v, default: () => null }),
  context: Annotation({ reducer: (_, v) => v, default: () => "" }),

  // Output
  reply: Annotation({ reducer: (_, v) => v, default: () => null }),
  toolCalls: Annotation({ reducer: (_, v) => v, default: () => [] }),
  suggestions: Annotation({ reducer: (_, v) => v, default: () => [] }),
});

// ──────────────────────────────────────────────
// Build & Compile Graph
// ──────────────────────────────────────────────
const nodes = createNodes(getModel);

const graph = new StateGraph(AgentState)
  .addNode("classifyIntentNode", nodes.classifyIntentNode)
  .addNode("planNode", nodes.planNode)
  .addNode("retrieveNode", nodes.retrieveNode)
  .addNode("answerNode", nodes.answerNode)
  .addNode("actionNode", nodes.actionNode)
  .addNode("chitchatNode", nodes.chitchatNode)

  // Entry
  .addEdge("__start__", "classifyIntentNode")

  // After intent classification → route
  .addConditionalEdges("classifyIntentNode", routeByIntent)

  // plan → retrieve → route to answer or action
  .addEdge("planNode", "retrieveNode")
  .addConditionalEdges("retrieveNode", routeExecution)

  // Terminal edges
  .addEdge("answerNode", "__end__")
  .addEdge("actionNode", "__end__")
  .addEdge("chitchatNode", "__end__");

const app = graph.compile();

// ──────────────────────────────────────────────
// Exported Entry Points
// ──────────────────────────────────────────────

/**
 * Main agent entry. Same signature & return shape as runLangChainAgent.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} accountContext
 * @returns {Promise<{reply: string|null, toolCalls?: object[], suggestions?: string[]}>}
 */
export async function runAgent(messages, accountContext = "") {
  const lastUserMsg =
    messages.filter((m) => m.role === "user").pop()?.content || "";

  const result = await app.invoke({
    messages,
    input: lastUserMsg,
    accountContext,
  });

  agentLog(
    "GRAPH",
    `Result: reply=${(result.reply || "").slice(0, 80)}… tools=${result.toolCalls?.length || 0}`,
  );

  return {
    reply: result.reply,
    ...(result.toolCalls?.length && { toolCalls: result.toolCalls }),
    ...(result.suggestions?.length && { suggestions: result.suggestions }),
  };
}

/**
 * Data slice planner. Same as planAccountDataSlicesLangChain.
 * Not part of the graph — separate endpoint concern.
 */
export const planAccountDataSlices = traceable(
  async function (userMessage) {
    agentLog(
      "PLANNER",
      `Planning slices for: "${userMessage.slice(0, 50)}..."`,
    );
    const chain = DATA_PLAN_PROMPT.pipe(getModel(0, "openai/gpt-4o-mini")).pipe(
      new JsonOutputParser(),
    );
    const slices = await chain.invoke({ input: userMessage });
    agentLog("PLANNER", `Selected slices: ${JSON.stringify(slices)}`);
    return { slices };
  },
  { name: "Firebase_Query_Planner", run_type: "tool" },
);
