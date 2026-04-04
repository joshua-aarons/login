/**
 * Flattens the partial object assembled by accountSliceFetch into short plain text
 * for direct injection into the system prompt.
 */

/**
 * @param {object | null | undefined} raw
 * @returns {string} Returns "" if no displayable fields are found
 */
export function formatAccountFetchToPlainText(raw) {
    if (!raw || typeof raw !== "object") return "";

    const lines = [];
    let hasFact = false;
    const add = (/** @type {string} */ s) => {
        lines.push(s);
        hasFact = true;
    };

    const info = raw.info;
    if (info && typeof info === "object") {
        if (info.displayName) add(`Name: ${info.displayName}`);
        if (info.email) add(`Email: ${info.email}`);
        if (info.firstName || info.lastName) {
            add(`Name parts: ${[info.firstName, info.lastName].filter(Boolean).join(" ")}`);
        }
    }

    if (raw.isAdmin !== undefined) add(`Admin: ${raw.isAdmin ? "yes" : "no"}`);
    if (raw.tierName != null && raw.tierName !== "") add(`Current tier label: ${raw.tierName}`);
    if (raw.maxTier != null) add(`Max tier id: ${raw.maxTier}`);
    if (raw.allTiersTitle) add(`Licences summary: ${raw.allTiersTitle}`);

    if (Array.isArray(raw.licences) && raw.licences.length) {
        add("Licences:");
        for (const l of raw.licences) {
            const label = [l.tierName || "?", l.licenceName || ""].filter(Boolean).join(" — ");
            lines.push(
                `  - ${label} | seats used: ${l.usedSeats ?? "n/a"} | status: ${l.status ?? "n/a"} | editor: ${Boolean(l.editor)}`
            );
        }
        hasFact = true;
    }

    if (raw.usage && typeof raw.usage === "object") {
        const usageLines = [];
        for (const [k, v] of Object.entries(raw.usage)) {
            if (!v || typeof v !== "object" || v.max === undefined) continue;
            usageLines.push(
                `  - ${k}: used ${v.used} / max ${v.max} (remaining ${v.remaining})`
            );
        }
        if (usageLines.length) {
            add("Usage quotas:");
            lines.push(...usageLines);
        }
    }

    if (Array.isArray(raw.sessions) && raw.sessions.length) {
        add(`Sessions (${raw.sessions.length}):`);
        for (const s of raw.sessions.slice(0, 20)) {
            lines.push(
                `  - ${s.description || s.sid || "?"} | start: ${s.startDate ?? "n/a"} | active: ${s.active ? "yes" : "no"}`
            );
        }
        if (raw.sessions.length > 20) {
            lines.push(`  ... and ${raw.sessions.length - 20} more`);
        }
        hasFact = true;
    }

    const respList = raw.responses?.responses;
    if (Array.isArray(respList)) {
        add(`Feedback / survey responses stored: ${respList.length}`);
    }

    if (raw.sessionLogs != null && typeof raw.sessionLogs === "object") {
        const n = Object.keys(raw.sessionLogs).length;
        add(`Profile-session log entries: ${n}`);
    }

    if (raw.licenceProducts && typeof raw.licenceProducts === "object") {
        const n = Object.keys(raw.licenceProducts).length;
        add(`Catalogue / public tier products: ${n}`);
    }

    if (!hasFact) return "";

    const header =
        "User account facts (use only for questions about this signed-in user; do not invent numbers not listed below).";
    return [header, "", ...lines].join("\n").trim();
}
