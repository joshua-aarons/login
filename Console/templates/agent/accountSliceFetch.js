/**
 * Fetch from Firebase on-demand by "slices", with paths consistent with watches in Firebase/*.js.
 * LLM only selects from whitelist keys; does not execute arbitrary path strings.
 * Does not rely on watch for allData; usage.max is calculated from tier-usage + user licence tier (consistent with licences.js).
 */

import {
    get,
    ref,
    query,
    orderByChild,
    equalTo,
} from "../../../Firebase/firebase-client.js";

function round(x, y) {
    return Math.round(Math.pow(10, y) * x) / Math.pow(10, y);
}

/** Consistent with slices in server/agent/dataPlan.js except all/none */
export const ALL_ACCOUNT_SLICES = [
    "profile",
    "usage",
    "licences",
    "sessions",
    "feedback",
    "session_logs",
    "catalog",
];

/**
 * @param {string} uid
 * @param {string[]} slices - from /api/chat/plan-account-data (may contain all / none)
 * @returns {Promise<object>}
 */
export async function fetchAccountDataBySlices(uid, slices) {
    const out = {};
    if (!uid || typeof uid !== "string") {
        return out;
    }

    const set = new Set(Array.isArray(slices) ? slices : []);

    if (set.has("none")) {
        return {};
    }

    /** @type {Set<string>} */
    const effective = new Set();
    if (set.has("all") || set.size === 0) {
        ALL_ACCOUNT_SLICES.forEach((s) => effective.add(s));
    } else {
        for (const s of set) {
            if (ALL_ACCOUNT_SLICES.includes(s)) effective.add(s);
        }
    }
    if (effective.size === 0) {
        ALL_ACCOUNT_SLICES.forEach((s) => effective.add(s));
    }

    const tasks = [];

    if (effective.has("profile")) {
        tasks.push(
            get(ref(`users/${uid}/info`)).then((snap) => {
                out.info = snap.val() || {};
            })
        );
    }

    if (effective.has("usage")) {
        tasks.push(populateUsageQuota(uid, out));
    }

    if (effective.has("licences")) {
        tasks.push(
            (async () => {
                const [licSnap, tierNamesSnap] = await Promise.all([
                    get(ref(`users/${uid}/licences`)),
                    get(ref(`licences-settings/tier-names`)),
                ]);
                const licMap = licSnap.val() || {};
                const tierNames = tierNamesSnap.val() || {};
                const licencesByID = {};

                await Promise.all(
                    Object.keys(licMap).map(async (lid) => {
                        const [nameSnap, statusSnap] = await Promise.all([
                            get(ref(`licences/${lid}/licenceName`)),
                            get(ref(`licences/${lid}/users/${uid}/status`)),
                        ]);
                        const status = statusSnap.val();
                        const editor = status === "admin" || status === "owner";
                        licencesByID[lid] = {
                            tier: licMap[lid],
                            tierName: tierNames[licMap[lid]] || "Unknown",
                            licenceName: nameSnap.val() || "",
                            usedSeats: 0,
                            status,
                            editor,
                            id: lid,
                        };
                    })
                );

                out.licencesByID = licencesByID;
                out.licences = Object.values(licencesByID);
                out.isAdmin = out.licences.some((l) => l.editor);
                const tierCounts = {};
                out.licences.forEach((l) => {
                    if (l.tier > 0) {
                        tierCounts[l.tierName] = (tierCounts[l.tierName] || 0) + 1;
                    }
                });
                out.allTiersTitle = Object.keys(tierCounts)
                    .map((t) => `${tierCounts[t]} x ${t}`)
                    .join(", ");
                const tiers = out.licences.map((l) => l.tier || 0);
                out.maxTier = tiers.length ? Math.max(...tiers) : 0;
                out.tierName = tierNames[out.maxTier] || "None";
            })()
        );
    }

    if (effective.has("sessions")) {
        tasks.push(
            (async () => {
                const [histSnap, activeSnap] = await Promise.all([
                    get(ref(`users/${uid}/session-history`)),
                    get(ref(`users/${uid}/active-session`)),
                ]);
                const hist = histSnap.val() || {};
                const activeId = activeSnap.val();
                const list = [];
                for (const sid of Object.keys(hist)) {
                    const info = hist[sid]?.info || {};
                    list.push({
                        sid,
                        description: info.description || "Session",
                        startDate: info.startDate || null,
                        active: sid === activeId,
                    });
                }
                out.sessions = list;
                out.sessionsBySID = hist;
                if (activeId) out.activeSessionId = activeId;
            })()
        );
    }

    if (effective.has("feedback")) {
        tasks.push(
            get(ref(`users/${uid}/responses`)).then((snap) => {
                const data = snap.val() || {};
                const responses = Object.entries(data).map(([key, value]) => {
                    if (!value.date) {
                        return { date: parseInt(key, 10), ...value };
                    }
                    return value;
                });
                out.responses = {
                    responses,
                    stats: {
                        totalResponses: {
                            statValue: responses.length,
                            statChange: "0.0%",
                            isPositive: true,
                        },
                    },
                };
            })
        );
    }

    if (effective.has("session_logs")) {
        tasks.push(
            get(ref(`users/${uid}/profile-logs`)).then((snap) => {
                out.sessionLogs = snap.val();
            })
        );
    }

    if (effective.has("catalog")) {
        tasks.push(
            get(
                query(
                    ref(`licences-settings/tier-info`),
                    orderByChild("public"),
                    equalTo(true)
                )
            ).then((snap) => {
                out.licenceProducts = snap.val() || {};
            })
        );
    }

    await Promise.all(tasks);
    return out;
}

/**
 * Merges users/{uid}/usage with plan limits (licences-settings/usage-template + tier-usage + user licences)
 * @param {string} uid
 * @param {object} out
 */
async function populateUsageQuota(uid, out) {
    const [usageTemplateSnap, tierUsageSnap, licSnap, usageSnap] = await Promise.all([
        get(ref(`licences-settings/usage-template`)),
        get(ref(`licences-settings/tier-usage`)),
        get(ref(`users/${uid}/licences`)),
        get(ref(`users/${uid}/usage`)),
    ]);
    const usageTemplate = usageTemplateSnap.val() || {};
    const tierSettings = tierUsageSnap.val() || {};
    const licencesMap = licSnap.val() || {};
    const rawUsageVal = usageSnap.val();

    const parseUsage = (usage) => {
        const parsed = {};
        for (const key of Object.keys(usageTemplate)) {
            if (usage && typeof usage === "object" && key in usage) {
                parsed[key] = usage[key];
            } else {
                parsed[key] = usageTemplate[key]?.default ?? 0;
            }
        }
        return parsed;
    };

    let usageMax = parseUsage(null);
    for (const tier of Object.values(licencesMap)) {
        if (tier == null || tier === "") continue;
        const tierUsage = parseUsage(tierSettings[tier]);
        for (const key of Object.keys(usageMax)) {
            usageMax[key] += tierUsage[key];
        }
    }

    const usageData = parseUsage(rawUsageVal);

    out.usage = {
        hours: { used: 0, max: 0, "%": 0, remaining: 0 },
    };
    for (const key of Object.keys(usageTemplate)) {
        out.usage[key] = {
            used: round(usageData[key], key === "minutes" ? 0 : 2),
            max: round(usageMax[key], key === "minutes" ? 0 : 2),
            "%": 0,
            remaining: 0,
        };
    }

    if (out.usage.minutes) {
        out.usage.hours.max = round(usageMax.minutes / 60, 2);
        out.usage.hours.used = round(out.usage.minutes.used / 60, 2);
    }

    for (const key of Object.keys(out.usage)) {
        const u = out.usage[key];
        if (!u || typeof u !== "object") continue;
        u["%"] = u.max > 0 ? round(u.used / u.max, 2) : 0;
        u.remaining = round(u.max - u.used, key === "minutes" ? 0 : 2);
    }
}
