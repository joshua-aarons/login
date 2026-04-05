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

const experienceRatings = {
    'Very poor': 1,
    'Poor': 2,
    'Neutral': 3,
    'Good': 4,
    'Very good': 5
}

const technicalIssues = ['connectivity', 'audio', 'platform', 'unresolved'];
const technicalIssuesLegend = ['Connectivity', 'Audio', 'Platform', "Unable to resolve"];

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

    console.log(`[Firebase Tool] Starting account data fetch for slices:`, Array.from(effective));
    const startTime = Date.now();
    const tasks = [];

    if (effective.has("profile")) {
        console.log(`[Firebase Tool] Triggering query: profile (users/${uid}/info)`);
        tasks.push(
            get(ref(`users/${uid}/info`)).then((snap) => {
                out.info = snap.val() || {};
                console.log(`[Firebase Tool] Fetched: profile`);
            })
        );
    }

    if (effective.has("usage")) {
        console.log(`[Firebase Tool] Triggering query: usage (multi-path)`);
        tasks.push(populateUsageQuota(uid, out).then(() => {
            console.log(`[Firebase Tool] Fetched: usage`);
        }));
    }

    if (effective.has("licences")) {
        console.log(`[Firebase Tool] Triggering query: licences (users/${uid}/licences + deep info)`);
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
                        const [licSnap, nameSnap, statusSnap] = await Promise.all([
                            get(ref(`licences/${lid}`)),
                            get(ref(`licences/${lid}/licenceName`)),
                            get(ref(`licences/${lid}/users/${uid}/status`)),
                        ]);
                        const licenceData = licSnap.val() || {};
                        const status = statusSnap.val();
                        const editor = status === "admin" || status === "owner";
                        licencesByID[lid] = {
                            ...licenceData,
                            tier: licMap[lid],
                            tierName: tierNames[licMap[lid]] || "Unknown",
                            licenceName: nameSnap.val() || licenceData.licenceName || "",
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
                console.log(`[Firebase Tool] Fetched: licences (${out.licences.length} found)`);
            })()
        );
    }

    if (effective.has("sessions")) {
        console.log(`[Firebase Tool] Triggering query: sessions (history + upcoming)`);
        tasks.push(
            (async () => {
                const [histSnap, activeSnap, v3Snap] = await Promise.all([
                    get(ref(`users/${uid}/session-history`)),
                    get(ref(`users/${uid}/active-session`)),
                    get(
                        query(
                            ref("sessions-v3"),
                            orderByChild("hostUID"),
                            equalTo(uid)
                        )
                    ),
                ]);

                const hist = histSnap.val() || {};
                const v3 = v3Snap.val() || {};
                const activeId = activeSnap.val();

                // Merge into a single map and a sorted list
                const allSessionsBySID = {};

                // Process v3 (upcoming/active)
                for (const sid of Object.keys(v3)) {
                    const info = v3[sid]?.info || {};
                    allSessionsBySID[sid] = {
                        sid,
                        description: info.description || "Session",
                        startDate: info.startDate || null,
                        startTime: info.startTime || null,
                        duration: info.duration || 5,
                        active: sid === activeId,
                        isHistory: false,
                    };
                }

                // Process history
                for (const sid of Object.keys(hist)) {
                    const hData = hist[sid] || {};
                    const info = hData.info || {};
                    allSessionsBySID[sid] = {
                        sid,
                        description: info.description || "Session",
                        startDate: info.startDate || hData.startDate || null,
                        startTime: hData.startTime || info.startTime || null,
                        duration: hData.duration || info.duration || 5,
                        active: sid === activeId,
                        isHistory: true,
                    };
                }

                out.sessionsBySID = allSessionsBySID;
                out.sessions = Object.values(allSessionsBySID).sort((a, b) => {
                    const timeA = new Date(a.startDate || 0).getTime();
                    const timeB = new Date(b.startDate || 0).getTime();
                    return timeB - timeA;
                });
                
                if (activeId) out.activeSessionId = activeId;
                console.log(`[Firebase Tool] Fetched: sessions (${out.sessions.length} found)`);
            })()
        );
    }

    if (effective.has("feedback")) {
        console.log(`[Firebase Tool] Triggering query: feedback (users/${uid}/responses + stats/charts)`);
        tasks.push(
            get(ref(`users/${uid}/responses`)).then((snap) => {
                const data = snap.val() || {};
                out.responses = parseFeedbackData(data);
                console.log(`[Firebase Tool] Fetched: feedback (${out.responses.responses.length} responses)`);
            })
        );
    }

    if (effective.has("session_logs")) {
        console.log(`[Firebase Tool] Triggering query: session_logs (users/${uid}/profile-logs)`);
        tasks.push(
            get(ref(`users/${uid}/profile-logs`)).then((snap) => {
                out.sessionLogs = snap.val();
                console.log(`[Firebase Tool] Fetched: session_logs`);
            })
        );
    }

    if (effective.has("catalog")) {
        console.log(`[Firebase Tool] Triggering query: catalog (licences-settings/tier-info [public=true])`);
        tasks.push(
            get(
                query(
                    ref(`licences-settings/tier-info`),
                    orderByChild("public"),
                    equalTo(true)
                )
            ).then((snap) => {
                out.licenceProducts = snap.val() || {};
                console.log(`[Firebase Tool] Fetched: catalog`);
            })
        );
    }

    await Promise.all(tasks);
    const duration = Date.now() - startTime;
    console.log(`[Firebase Tool] Completed all fetches in ${duration}ms.`);
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

// --- Feedback Helpers (Synced with Firebase/responses.js) ---

function parseFeedbackData(data) {
    const responses = Object.entries(data || {}).map(([key, value]) => {
        if (!value.date) {
            return { date: parseInt(key, 10), ...value };
        }
        return value;
    });
    return {
        responses,
        stats: getStatData(responses),
        charts: getChartData(responses),
    };
}

function getStatData(responses) {
    const stats = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthResponses = responses.filter(r => new Date(r.date).getMonth() === currentMonth);
    const lastMonthResponses = responses.filter(r => new Date(r.date).getMonth() === lastMonth);

    const calcChange = (curr, last) => (last === 0 ? 0 : ((curr - last) / last) * 100);

    // Total Responses
    const totalChange = calcChange(currentMonthResponses.length, lastMonthResponses.length);
    stats.totalResponses = {
        isPositive: totalChange >= 0,
        statValue: currentMonthResponses.length,
        statChange: Math.abs(totalChange).toFixed(1) + "%",
    };

    // NPS
    const sumNPS = (list) => {
        const filtered = list.filter(r => r.npsScore !== undefined && r.npsScore !== -1);
        return filtered.length > 0 ? filtered.reduce((a, b) => a + b.npsScore, 0) / filtered.length : 0;
    };
    const currNps = sumNPS(currentMonthResponses);
    const lastNps = sumNPS(lastMonthResponses);
    const npsChange = calcChange(currNps, lastNps);
    stats.nps = {
        isPositive: npsChange >= 0,
        statValue: currNps.toFixed(1),
        statChange: Math.abs(npsChange).toFixed(1) + "%",
    };

    // Experience
    const sumExp = (list) => {
        const filtered = list.filter(r => r.experience && experienceRatings[r.experience]);
        return filtered.length > 0 
            ? (filtered.reduce((a, b) => a + experienceRatings[b.experience], 0) / (filtered.length * 5)) * 100 
            : 0;
    };
    const currExp = sumExp(currentMonthResponses);
    const lastExp = sumExp(lastMonthResponses);
    const expChange = calcChange(currExp, lastExp);
    stats.experience = {
        isPositive: expChange >= 0,
        statValue: currExp.toFixed(1) + "%",
        statChange: Math.abs(expChange).toFixed(1) + "%",
    };

    return stats;
}

function getChartData(responses) {
    return {
        timeline: getTimelineData(responses),
        nps: getNpsData(responses),
        experience: getExperienceData(responses),
        technical: getTechnicalData(responses),
    };
}

function getTimelineData(data) {
    const timeline = [];
    const currentMonth = new Date().getMonth();
    for (let i = 0; i < 10; i++) {
        const filterMonth = (currentMonth - i + 12) % 12;
        const monthResponses = data.filter(r => new Date(r.date).getMonth() === filterMonth);
        const npsList = monthResponses.filter(r => r.npsScore !== undefined && r.npsScore !== -1);
        timeline.push({
            x: 10 - i,
            y: npsList.length > 0 ? (npsList.reduce((a, b) => a + b.npsScore, 0) / npsList.length).toFixed(2) : 0,
        });
    }
    return timeline.sort((a, b) => a.x - b.x);
}

function getNpsData(data) {
    return [
        data.filter(r => r.npsScore >= 0 && r.npsScore < 7).length,
        data.filter(r => r.npsScore >= 7 && r.npsScore < 9).length,
        data.filter(r => r.npsScore >= 9 && r.npsScore <= 10).length,
    ];
}

function getExperienceData(data) {
    const experienceData = {};
    const legend = {};
    Object.keys(experienceRatings).forEach((level, index) => {
        const count = data.filter(r => r.experience === level).length;
        experienceData[index] = count;
        legend[level] = count;
    });
    return { experienceData, legend };
}

function getTechnicalData(data) {
    const technicalData = [];
    const legend = {};
    for (const issue of technicalIssues) {
        const count = data.filter(r => r.technicalDifficulties && r.technicalDifficulties.includes(issue)).length;
        technicalData.push(count);
    }
    const total = technicalData.reduce((a, b) => a + b, 0);
    technicalIssuesLegend.forEach((issue, index) => {
        const pct = total === 0 ? "0%" : ((technicalData[index] / total) * 100).toFixed(0) + "%";
        legend[issue] = {
            percent: `${issue} (${pct})`,
            count: `${technicalData[index]} reports`,
        };
    });
    return { technicalData, legend };
}
