import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_LOG = resolve(__dirname, "..", "agent.log");

/**
 * Shared logger for the agent.
 * @param {string} module - Module name (e.g. "ROUTER", "ACTION_AGENT")
 * @param {string} msg - Message to log
 */
export function agentLog(module, msg) {
  const line = `[${new Date().toISOString()}] [${module}] ${msg}\n`;
  console.log(`[${module}]`, msg);
  try {
    fs.appendFileSync(AGENT_LOG, line);
  } catch (_) {}
}
