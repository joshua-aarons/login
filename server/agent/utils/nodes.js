/**
 * LangGraph Node Functions for Squidly Agent.
 *
 * Each node takes AgentState and returns a partial state update.
 * Call createNodes(getModel) from agent.js to bind the model factory.
 *
 * Graph flow:
 *   START → classifyIntent
 *     ├── (chitchat)      → chitchatNode       → END
 *     ├── (cancel)         → END (immediate)
 *     └── (plan_execute)   → planNode → retrieveNode
 *           → routeExecution
 *             ├── (answer) → answerNode  → END
 *             └── (action) → actionNode  → END
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { TOOLS_DEFINITIONS } from "../constants.js";
import { agentLog } from "../logger.js";
import { validateToolCalls } from "../validator.js";
import { retrieve } from "../rag.js";
import {
  ROUTER_PROMPT,
  PLAN_PROMPT,
  ANSWER_PROMPT,
  ACTION_PROMPT,
  CHITCHAT_PROMPT,
} from "./prompts.js";

const CONFIRM_WORDS = [
  "yes",
  "confirm",
  "proceed",
  "next step",
  "go ahead",
  "ok",
  "sure",
];
const CANCEL_WORDS = ["cancel", "no", "stop", "nevermind"];

/**
 * Helper: convert state.messages [{role, content}] to history tuples
 * for ChatPromptTemplate MessagesPlaceholder.
 * Excludes the last message (which is passed as {input}).
 */
function buildHistory(messages) {
  return messages.slice(0, -1).map((m) => [m.role, m.content || ""]);
}

/**
 * Factory: returns all node functions bound to the given getModel helper.
 * @param {Function} getModel - (temperature, modelName) => ChatOpenAI
 */
export function createNodes(getModel) {
  // ──────────────────────────────────────────────
  // NODE: classifyIntent
  // Detects hard confirm/cancel first, then falls back to LLM router.
  // Returns: { intent } and optionally { plan, reply, toolCalls, suggestions }
  // ──────────────────────────────────────────────
  async function classifyIntentNode(state) {
    const cleanMsg = state.input
      .toLowerCase()
      .trim()
      .replace(/[!.?]$/, "");
    const isHardConfirm = CONFIRM_WORDS.includes(cleanMsg);
    const isHardCancel = CANCEL_WORDS.includes(cleanMsg);

    // Hard cancel → short-circuit to END with canned reply
    if (isHardCancel) {
      agentLog("ROUTER", "Hard cancel detected");
      return {
        intent: "cancel",
        reply: "Action cancelled.",
        toolCalls: [],
        suggestions: [],
      };
    }

    // Hard confirm → skip router AND plan, go straight to action
    if (isHardConfirm) {
      agentLog("ROUTER", "Hard confirm detected");
      return {
        intent: "plan_execute",
        plan: {
          responseType: "action",
          needsRag: false,
          focus: "account_data",
          isConfirmation: true,
        },
      };
    }

    // LLM classification
    // TODO: implement
    //   1. const chain = ROUTER_PROMPT.pipe(getModel(0, "openai/gpt-4o-mini")).pipe(new StringOutputParser());
    //   2. const raw = await chain.invoke({ input: state.input, history: buildHistory(state.messages) });
    //   3. Parse raw.toLowerCase() → "chitchat" or default "plan_execute"
    //   4. agentLog("ROUTER", `Intent: ${intent}`);
    //   5. return { intent };
    throw new Error("classifyIntentNode: not implemented");
  }

  // ──────────────────────────────────────────────
  // NODE: plan
  // Determines { responseType, needsRag, focus } via LLM.
  // Skipped when isConfirmation is already set by classifyIntentNode.
  // This is the KEY node that fixes the "navigation instead of data" bug.
  // ──────────────────────────────────────────────
  async function planNode(state) {
    // Hard-confirm shortcut — plan was already set by classifyIntentNode
    if (state.plan?.isConfirmation) {
      agentLog("PLAN", "Skipping plan — hard confirmation");
      return {};
    }

    // LLM planning
    // TODO: implement
    //   1. const chain = PLAN_PROMPT.pipe(getModel(0, "openai/gpt-4o-mini")).pipe(new JsonOutputParser());
    //   2. const plan = await chain.invoke({ input: state.input, history: buildHistory(state.messages) });
    //   3. agentLog("PLAN", `Plan: ${JSON.stringify(plan)}`);
    //   4. return { plan };
    throw new Error("planNode: not implemented");
  }

  // ──────────────────────────────────────────────
  // NODE: retrieve (conditional RAG)
  // Only calls the vector store if plan.needsRag is true.
  // ──────────────────────────────────────────────
  async function retrieveNode(state) {
    if (!state.plan?.needsRag) {
      agentLog("RAG", "Skipping retrieval — not needed");
      return { context: "" };
    }

    // TODO: implement
    //   1. const context = await retrieve(state.input);
    //   2. agentLog("RAG", `Retrieved ${context.length} chars`);
    //   3. return { context };
    throw new Error("retrieveNode: not implemented");
  }

  // ──────────────────────────────────────────────
  // NODE: answer (focus-aware)
  // Uses ANSWER_PROMPT with {focus} to prioritize account data vs docs.
  // ──────────────────────────────────────────────
  async function answerNode(state) {
    // TODO: implement
    //   1. const chain = ANSWER_PROMPT.pipe(getModel(0.3, "openai/gpt-4o-mini")).pipe(new StringOutputParser());
    //   2. const reply = await chain.invoke({
    //        input: state.input,
    //        history: buildHistory(state.messages),
    //        context: state.context || "",
    //        accountContext: state.accountContext || "",
    //        focus: state.plan?.focus || "both",
    //      });
    //   3. return { reply, toolCalls: [], suggestions: [] };
    throw new Error("answerNode: not implemented");
  }

  // ──────────────────────────────────────────────
  // NODE: action (tool calling + validation)
  // Binds TOOLS_DEFINITIONS to the model and handles confirmation flow.
  // ──────────────────────────────────────────────
  async function actionNode(state) {
    // TODO: implement
    //   1. const modelWithTools = getModel(0, "openai/gpt-4o-mini").bindTools(
    //        TOOLS_DEFINITIONS.map(t => ({ type: "function", function: t }))
    //      );
    //   2. const chain = ACTION_PROMPT.pipe(modelWithTools);
    //   3. const result = await chain.invoke({
    //        input: state.input,
    //        history: buildHistory(state.messages),
    //        context: state.context || "",
    //      });
    //   4. const reply = result.content;
    //   5. const toolCalls = (result.tool_calls || []).map(tc => ({ name: tc.name, arguments: tc.args }));
    //   6. const { valid } = validateToolCalls(toolCalls);
    //
    //   7. // Hard confirm — return ONLY tool calls, no verbal reply
    //      if (state.plan?.isConfirmation && valid.length > 0) {
    //        return { reply: null, toolCalls: valid, suggestions: [] };
    //      }
    //
    //   8. // Normal flow
    //      let finalReply = reply;
    //      if (!finalReply && valid.length > 0) finalReply = "Certainly! I'm performing that action for you now.";
    //      else if (!finalReply) finalReply = "I'm ready to help. Please let me know what to do next.";
    //
    //   9. let suggestions = [];
    //      const lower = finalReply.toLowerCase();
    //      if (lower.includes("?") || lower.includes("confirm") || lower.includes("proceed")) {
    //        suggestions = ["Yes", "Cancel"];
    //      }
    //
    //  10. return { reply: finalReply, toolCalls: valid, suggestions };
    throw new Error("actionNode: not implemented");
  }

  // ──────────────────────────────────────────────
  // NODE: chitchat
  // Simple friendly response, no tools or account data.
  // ──────────────────────────────────────────────
  async function chitchatNode(state) {
    // TODO: implement
    //   1. const chain = CHITCHAT_PROMPT.pipe(getModel(0.7, "openai/gpt-4o-mini")).pipe(new StringOutputParser());
    //   2. const reply = await chain.invoke({ input: state.input, history: buildHistory(state.messages) });
    //   3. return { reply };
    throw new Error("chitchatNode: not implemented");
  }

  return {
    classifyIntentNode,
    planNode,
    retrieveNode,
    answerNode,
    actionNode,
    chitchatNode,
  };
}

// ──────────────────────────────────────────────
// ROUTING FUNCTIONS (used as conditional edges)
// ──────────────────────────────────────────────

/**
 * Routes after classifyIntentNode.
 * @returns "chitchatNode" | "planNode" | "__end__"
 */
export function routeByIntent(state) {
  if (state.intent === "cancel") return "__end__";
  if (state.intent === "chitchat") return "chitchatNode";
  return "planNode"; // "plan_execute"
}

/**
 * Routes after retrieveNode based on plan.responseType.
 * @returns "answerNode" | "actionNode"
 */
export function routeExecution(state) {
  return state.plan?.responseType === "action" ? "actionNode" : "answerNode";
}
