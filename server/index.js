/**
 * Squidly Chatbot - Hybrid Agent Architecture
 * Intent Router → question (RAG + optional accountContext text, no LLM tools) | action (LLM tools) | chitchat
 *
 * Startup: npm start
 * Loads GROQ_API_KEY from .env or ../.env
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config({ path: resolve(__dirname, ".env") });

import fs from "fs";
import express from "express";
import cors from "cors";
import { runLangChainAgent, planAccountDataSlicesLangChain } from "./agent/langchainAgent.js";

/** Prevent excessively large payloads */
const MAX_ACCOUNT_CONTEXT_CHARS = 20000;

function sanitizeAccountContextText(s) {
  if (typeof s !== "string") return "";
  const t = s.trim();
  if (!t) return "";
  if (t.length <= MAX_ACCOUNT_CONTEXT_CHARS) return t;
  return `${t.slice(0, MAX_ACCOUNT_CONTEXT_CHARS)}\n…(truncated)`;
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const AGENT_LOG = resolve(__dirname, "agent.log");
function agentLog(...args) {
  const line = `[${new Date().toISOString()}] [pid ${process.pid}] ${args.join(" ")}\n`;
  console.log("[AGENT]", ...args);
  try {
    fs.appendFileSync(AGENT_LOG, line);
  } catch (_) {}
}

/**
 * LLM selects which account data slices to pull from a whitelist
 */
app.post("/api/chat/plan-account-data", async (req, res) => {
  const { message = "" } = req.body || {};
  try {
    const { slices } = await planAccountDataSlicesLangChain(message);
    return res.json({ slices });
  } catch (err) {
    console.error("plan-account-data error:", err);
    return res.status(500).json({
      error: "Planner failed.",
      slices: ["all"],
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages = [], accountContext = null } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  const accountBlock = sanitizeAccountContextText(
    typeof accountContext === "string" ? accountContext : ""
  );

  try {
    const response = await runLangChainAgent(messages, accountBlock);
    agentLog("LangChain Response:", JSON.stringify(response).slice(0, 200));
    return res.json(response);
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({
      error: "The assistant is temporarily unavailable. Please try again.",
    });
  }
});


app.listen(PORT, () => {
  console.log(`Squidly Chatbot API (Hybrid Agent) at http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn("WARNING: GROQ_API_KEY not set. Chatbot will not work.");
  }
});
