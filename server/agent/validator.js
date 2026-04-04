/**
 * Tool Call Validator - Server-side validation before execution.
 * Only allows whitelisted tools with valid arguments.
 */

import { ALLOWED_PANELS, TOOLS_DEFINITIONS } from "./constants.js";

/** Allowed tool names */
const ALLOWED_TOOLS = new Set(TOOLS_DEFINITIONS.map((t) => t.name));

/** Valid panel values for open_panel */
const VALID_PANELS = new Set(ALLOWED_PANELS);

/**
 * Validate a single tool call.
 * @param {{ name: string, arguments?: object }} toolCall
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateToolCall(toolCall) {
  if (!toolCall || typeof toolCall.name !== "string") {
    return { valid: false, error: "Invalid tool call: missing name" };
  }

  if (!ALLOWED_TOOLS.has(toolCall.name)) {
    return { valid: false, error: `Tool not allowed: ${toolCall.name}` };
  }

  const args = toolCall.arguments || {};

  if (toolCall.name === "open_panel") {
    const panel = args.panel;
    if (!panel || typeof panel !== "string") {
      return { valid: false, error: "open_panel requires 'panel' argument" };
    }
    if (!VALID_PANELS.has(panel)) {
      return { valid: false, error: `Invalid panel: ${panel}` };
    }
  }

  return { valid: true };
}

/**
 * Validate all tool calls. Returns only valid ones; invalid are filtered out.
 * @param {Array<{ name: string, arguments?: object }>} toolCalls
 * @returns {{ valid: Array, invalid: Array<{ tool: object, error: string }> }}
 */
export function validateToolCalls(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return { valid: [], invalid: [] };
  }

  const valid = [];
  const invalid = [];

  for (const tc of toolCalls) {
    const result = validateToolCall(tc);
    if (result.valid) {
      valid.push(tc);
    } else {
      invalid.push({ tool: tc, error: result.error });
    }
  }

  return { valid, invalid };
}
