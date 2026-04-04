/**
 * UI Actions - Frontend executable UI operations (switching panels, opening modals, etc.).
 * Only called by toolExecutor when backend returns toolCalls; frontend contains no agent/intent logic.
 */

/** @typedef {import("../app-view.js").AppView} AppView */

/**
 * Schedule meeting - opens the scheduler modal
 * @param {AppView} appView
 * @returns {string}
 */
export function scheduleMeetingSkill(appView) {
    if (appView && typeof appView.scheduleMeeting === "function") {
        appView.scheduleMeeting();
        return "Opened the schedule meeting window. Fill in time, duration, and description, then save.";
    }
    return "Could not open schedule meeting. Please try again.";
}

/**
 * Host meeting - creates session and redirects
 * @param {AppView} appView
 * @returns {string}
 */
export function hostMeetingSkill(appView) {
    if (appView && typeof appView.hostMeeting === "function") {
        appView.hostMeeting();
        return "Creating meeting and redirecting...";
    }
    return "Could not create meeting. Check your licence or try again.";
}

/**
 * Open panel - switches sidebar to the given panel
 * @param {AppView} appView
 * @param {string} panel - Panel id (e.g. dash-board, settings-panel)
 * @returns {string}
 */
export function openPanelSkill(appView, panel) {
    const panelNames = {
        "dash-board": "Dashboard",
        "settings-panel": "Settings",
        "profile-panel": "Profile",
        "licences-page": "Licences",
        "support-panel": "Support",
        "feedback-page": "Feedback",
        "admin-control": "Admin Control",
        "clients-page": "Clients",
        "data-and-privacy": "Data & Privacy",
        "meetings-panel": "Meetings",
    };
    const name = panelNames[panel] || panel;
    if (appView && "panel" in appView) {
        appView.panel = panel;
        return `Opened the ${name} panel.`;
    }
    return `Could not open ${name}. Please try again.`;
}

/**
 * Open AAC Grid Editor
 * @param {AppView} appView
 * @returns {string}
 */
export function openGridEditorSkill(appView) {
    if (appView && typeof appView.openGridEditor === "function") {
        appView.openGridEditor();
        return "Opened the AAC Grid Editor. You can create or edit symbol boards.";
    }
    return "Could not open AAC Grid Editor. Please try again.";
}

/**
 * Open Quiz Editor
 * @param {AppView} appView
 * @returns {string}
 */
export function openQuizEditorSkill(appView) {
    if (appView && typeof appView.openQuizEditor === "function") {
        appView.openQuizEditor();
        return "Opened the Quiz Editor. You can create or edit quizzes.";
    }
    return "Could not open Quiz Editor. Please try again.";
}
