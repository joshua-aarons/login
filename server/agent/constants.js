/**
 * Agent Constants - Single Source of Truth for Agent Configuration.
 * All whitelist and enum values should be defined here.
 */

/**
 * Valid panel IDs that the agent can open via the 'open_panel' tool.
 * These correspond to the component 'name' in app-view.js.
 */
export const ALLOWED_PANELS = [
  "dash-board",
  "settings-panel",
  "profile-panel",
  "licences-page",
  "support-panel",
  "feedback-page",
  "admin-control",
  "clients-page",
  "data-and-privacy",
  "meetings-panel",
];

/**
 * Account data slices that can be fetched from Firebase.
 */
export const ACCOUNT_SLICES = [
  "profile",      // users/{uid}/info
  "usage",        // users/{uid}/usage
  "licences",     // users/{uid}/licences + licences/{id}/...
  "sessions",     // session-history + active-session
  "feedback",     // users/{uid}/responses
  "session_logs", // users/{uid}/profile-logs
  "catalog",      // licences-settings/tier-info
];

/**
 * Tool definitions for the Action Agent.
 */
export const TOOLS_DEFINITIONS = [
  {
    name: "schedule_meeting",
    description: "Opens the schedule meeting modal. Use when user says 'open schedule meeting' or 'I want to schedule now'.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "host_meeting",
    description: "Creates and starts a meeting immediately. Use when user says 'host meeting' or 'start session now'.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "open_panel",
    description: "Opens a specific panel in the console.",
    parameters: {
      type: "object",
      properties: {
        panel: {
          type: "string",
          enum: ALLOWED_PANELS,
          description: "The panel to open (e.g. settings-panel, dash-board, etc.)",
        },
      },
      required: ["panel"],
    },
  },
  {
    name: "open_grid_editor",
    description: "Opens the AAC Grid Editor. Use when user says 'open grid editor' or 'open AAC editor'.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "open_quiz_editor",
    description: "Opens the Quiz Editor. Use when user says 'open quiz editor'.",
    parameters: { type: "object", properties: {} },
  },
];
