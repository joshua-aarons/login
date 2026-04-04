/**
 * Agent API - Calls the local LLM server
 */

const CHAT_API_URL = "http://localhost:3001/api/chat";
const CHAT_API_ORIGIN = CHAT_API_URL.replace(/\/api\/chat\/?$/, "");

/**
 * Call the local LLM API
 * @param {Array<{role: string, content: string}>} messages - Chat history
 * @param {{ accountContext?: string }} [options] - Optional: account-related plain text, assembled by frontend and injected as-is into system prompt by backend
 * @returns {Promise<{reply?: string, toolCalls?: Array<{name: string, arguments: object}>}>}
 */
export async function chatWithLLM(messages, options = {}) {
    const body = { messages };
    if (typeof options.accountContext === "string" && options.accountContext.trim() !== "") {
        body.accountContext = options.accountContext.trim();
    }
    const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.error || "No response from assistant");
    }
    return data;
}

/**
 * Requests backend: returns a whitelist of account data slices to fetch based on user question
 * @param {string} message - Current user question
 * @returns {Promise<string[]>}
 */
export async function fetchAccountDataPlan(message) {
    const res = await fetch(`${CHAT_API_ORIGIN}/api/chat/plan-account-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || "" }),
    });
    const data = await res.json();
    if (!res.ok) {
        return data?.slices && Array.isArray(data.slices) ? data.slices : ["all"];
    }
    return Array.isArray(data.slices) ? data.slices : ["all"];
}
