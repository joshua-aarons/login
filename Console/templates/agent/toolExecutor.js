/**
 * Tool Executor - Only executes corresponding UI operations based on toolCalls returned by the backend.
 * Frontend contains no intent or agent logic, only responsible for "executing instructions from the backend".
 */

import {
    scheduleMeetingSkill,
    hostMeetingSkill,
    openPanelSkill,
    openGridEditorSkill,
    openQuizEditorSkill,
} from "./skills.js";

/** @typedef {import("../app-view.js").AppView} AppView */

/**
 * Executes a single tool call from the backend (name + arguments → UI action)
 * @param {string} name - Tool name returned by backend
 * @param {object} args - Arguments returned by backend
 * @param {AppView} appView - Current app view
 * @returns {string} Execution result text, used for display
 */
export function executeToolCall(name, args, appView) {
    if (!appView) return "Please log in to the Console first.";
    try {
        switch (name) {
            case "schedule_meeting":
                return scheduleMeetingSkill(appView);
            case "host_meeting":
                return hostMeetingSkill(appView);
            case "open_panel":
                return openPanelSkill(appView, args?.panel || "dash-board");
            case "open_grid_editor":
                return openGridEditorSkill(appView);
            case "open_quiz_editor":
                return openQuizEditorSkill(appView);
            default:
                return `Unknown tool: ${name}`;
        }
    } catch (e) {
        console.warn("Tool execution error:", e);
        return "Something went wrong. Please try again.";
    }
}
