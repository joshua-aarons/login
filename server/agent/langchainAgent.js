import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { TOOLS_DEFINITIONS, ACCOUNT_SLICES } from "./constants.js";
import { agentLog } from "./logger.js";
import { validateToolCalls } from "./validator.js";
import { retrieve } from "./rag.js";

/**
 * LangChain Agent - Modular, Traceable, and Formalized.
 * Uses OpenRouter and LangSmith for tracing.
 */

// 1. Initialize Model with OpenRouter
const getModel = (temperature = 0.7, modelName = "openai/gpt-4o-mini") => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Missing API Key! Check your .env file.");
  }
  return new ChatOpenAI({
    apiKey: apiKey,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://squidly.ai",
        "X-Title": "Squidly Assistant",
      },
    },
    modelName: modelName,
    temperature: temperature,
  });
};

// 2. Prompts
const ROUTER_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are an intent classifier for the Squidly Assistant.
Squidly is an AAC (Augmentative and Alternative Communication) platform.

Classify the user's latest message into exactly one of these categories:
- "action": User confirms a previous suggestion (e.g., "Yes", "Confirm", "Do it") OR requests an operation (e.g., "Open settings", "Host a meeting").
- "question": Informational questions about product or account data.
- "chitchat": Greetings, thanks, or general small talk.

CRITICAL: If the assistant just asked for confirmation (e.g., "Would you like to...?") and the user replies "Yes", "Sure", or "Go ahead", it MUST be classified as "action".

IMPORTANT: Output ONLY ONE WORD ("action", "question", or "chitchat"). Do not include any other text, punctuation, or explanation.`],
  new MessagesPlaceholder("history"),
  ["user", "{input}"],
]);

const DATA_PLAN_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are a data router for Squidly Console. Given the user's latest message, decide which account data slices are needed to answer accurately.

Output ONLY a JSON array of strings. No markdown, no explanation.

Allowed values (pick the minimum set):
${ACCOUNT_SLICES.map(s => `- "${s}"`).join("\n")}
- "all" — full account overview OR many areas (client will fetch every allowed slice)
- "none" — purely product how-to, navigation, or chitchat with no personal account facts

Rules:
- If the question is "how do I …" about the product UI, use ["none"].
- If asking "my tier", "my plan", "am I admin": ["licences"] or ["profile","licences"].
- If asking "how many minutes/sessions left": ["usage"] or ["usage","licences"].
- If unsure but clearly personal account: ["all"].`],
  ["user", "{input}"],
]);

const QUESTION_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are the Squidly Assistant for the Squidly Console. Squidly is a platform for AAC (Augmentative and Alternative Communication) sessions and meetings.

The user is asking an informational question. Use the **documentation** below for product how-tos. 
If **user account facts** are provided, use them for questions about this user's plan, usage, licences, sessions, or admin status—do not invent numbers. 

**Documentation:**
{context}

**User Account Facts:**
{accountContext}

Answer from the docs. If the docs don't cover the question, say so. Do NOT call any tools or perform UI actions.`],
  new MessagesPlaceholder("history"),
  ["user", "{input}"],
]);

const ACTION_SYSTEM_PROMPT = `You are the Squidly Assistant, a specialized navigator for the Squidly Console.

Your role is to guide the user through the console and perform actions.

ACTION CONFIRMATION FLOW:
1. When a user expresses a clear desire to perform an action (e.g., "I want to host a meeting"), but has NOT explicitly confirmed or provided necessary details yet:
   - EXPLAIN what the action does based on the Documentation.
   - ASK for confirmation or missing details.
   - DO NOT call the tool yet.
   - Output your explanation and question.

2. When a user explicitly CONFIRMS (e.g., "Yes", "Go ahead", "Confirm", "Do it") OR gives a DIRECT COMMAND (e.g., "Host a meeting now"):
   - CALL the appropriate tool via the tool calling interface.
   - You MUST also provide a verbal response explaining exactly what you are doing.

CRITICAL RULES:
- YOU MUST ALWAYS PROVIDE A TEXT RESPONSE. DO NOT CALL A TOOL WITHOUT A VERBAL EXPLANATION.
- If the user has not confirmed, DO NOT output any tool calls.
- NEVER return an empty text response when calling a tool.

GUIDELINES:
- No Technical Names: Never type "schedule_meeting" or "open_panel" in your response. Use natural language.
- Ask Back: If the request is ambiguous, ASK to clarify.

**Documentation:**
{context}

Output: Plain Markdown explanation and confirmation question.`;

const ACTION_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", ACTION_SYSTEM_PROMPT],
  new MessagesPlaceholder("history"),
  ["user", "{input}"],
]);

// 3. Main Agent Function
export async function runLangChainAgent(messages, accountContext = "") {
  const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
  const history = messages.slice(0, -1).map(m => [m.role, m.content || ""]);

  const CONFIRM_WORDS = ["yes", "confirm", "proceed", "next step", "go ahead", "ok", "sure"];
  const CANCEL_WORDS = ["cancel", "no", "stop", "nevermind"];
  const cleanMsg = lastUserMsg.toLowerCase().trim().replace(/[!.?]$/, "");

  const isHardConfirm = CONFIRM_WORDS.includes(cleanMsg);
  const isHardCancel = CANCEL_WORDS.includes(cleanMsg);

  // A. Classify Intent (Force "action" for hardcoded options to bypass router)
  let intent;
  if (isHardConfirm || isHardCancel) {
    intent = "action";
  } else {
    const routerChain = ROUTER_PROMPT.pipe(getModel(0, "openai/gpt-4o-mini")).pipe(new StringOutputParser());
    const rawIntent = await routerChain.invoke({ 
      input: lastUserMsg,
      history: history
    });
    const lower = rawIntent.toLowerCase();
    if (lower.includes("action")) intent = "action";
    else if (lower.includes("question")) intent = "question";
    else if (lower.includes("chitchat")) intent = "chitchat";
    else intent = "question"; // Default fallback
  }
  agentLog("LANGCHAIN", `Intent: ${intent} (Hardcoded: ${isHardConfirm || isHardCancel})`);

  // B. Retrieve Knowledge
  const context = await retrieve(lastUserMsg);

  if (intent === "question") {
    const questionChain = QUESTION_PROMPT.pipe(getModel(0.3, "openai/gpt-4o-mini")).pipe(new StringOutputParser());
    const reply = await questionChain.invoke({
      input: lastUserMsg,
      history: history,
      context: context,
      accountContext: accountContext,
    });
    return { reply };
  }

  if (intent === "action") {
    // Immediate stop for hardcoded cancel
    if (isHardCancel) {
      return { reply: "Action cancelled.", toolCalls: [], suggestions: [] };
    }

    const modelWithTools = getModel(0, "openai/gpt-4o-mini").bindTools(TOOLS_DEFINITIONS.map(t => ({
      type: "function",
      function: t,
    })));
    
    const chain = ACTION_PROMPT.pipe(modelWithTools);
    const result = await chain.invoke({
      input: lastUserMsg,
      history: history,
      context: context,
    });

    const reply = result.content;
    const toolCalls = result.tool_calls?.map(tc => ({
      name: tc.name,
      arguments: tc.args,
    })) || [];

    const { valid } = validateToolCalls(toolCalls);
    
    // If it's a hardcoded confirmation, we return ONLY the tool call (no verbal reply)
    if (isHardConfirm && valid.length > 0) {
      return {
        reply: null, 
        toolCalls: valid,
        suggestions: [],
      };
    }

    // Normal flow: determine reply and suggestions
    let finalReply = reply;
    if (!finalReply && valid.length > 0) {
      finalReply = "Certainly! I'm performing that action for you now.";
    } else if (!finalReply) {
      finalReply = "I'm ready to help. Please let me know what to do next.";
    }

    let suggestions = [];
    const replyLower = finalReply.toLowerCase();
    if (replyLower.includes("?") || replyLower.includes("confirm") || replyLower.includes("proceed")) {
      suggestions = ["Yes", "Cancel"];
    }

    return {
      reply: finalReply,
      toolCalls: valid,
      suggestions: suggestions,
    };
  }

  // Chitchat branch
  const chitchatChain = ChatPromptTemplate.fromMessages([
    ["system", "You are the Squidly Assistant, a friendly helper for the Squidly Console. Keep replies brief and welcoming."],
    new MessagesPlaceholder("history"),
    ["user", "{input}"],
  ]).pipe(getModel(0.7, "openai/gpt-4o-mini")).pipe(new StringOutputParser());

  const reply = await chitchatChain.invoke({
    input: lastUserMsg,
    history: history,
  });
  return { reply };
}

export async function planAccountDataSlicesLangChain(userMessage) {
  const dataPlanChain = DATA_PLAN_PROMPT.pipe(getModel(0, "openai/gpt-4o-mini")).pipe(new JsonOutputParser());
  const slices = await dataPlanChain.invoke({ input: userMessage });
  return { slices };
}
