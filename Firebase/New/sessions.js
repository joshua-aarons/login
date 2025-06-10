/**
 * @typedef {Object} SessionInfo
 * @property {number} scheduledTime - The session ID.
 * 
 */

import { callFunction, equalTo, get, onChildAdded, onChildRemoved, onValue, orderByChild, query, ref, set, update } from "../firebase-client.js";
/**
 * @typedef {Object} SessionHistory
 * @property {number} startTime - The session start time in milliseconds.
 * @property {number} duration - The session duration in milliseconds.
 * @property {SessionInfo} info - The session information.
 */

/** 
 * @typedef {Object} SessionDescriptor
 * @property {string} hostUID - The session ID.
 * @property {boolean} active - The session ID.
 * @property {SessionInfo} info
*/


/**
 * @typedef {Object} Session
 * @property {string} sid - The session ID.
 * @property {number} time - The session start time in milliseconds.
 * @property {number} duration - The session duration in minutes.
 * @property {string} date - The session date in the format "DD/MM/YYYY HH:MM AM".
 * @property {string} status - The session status, can be "complete", "active", or "upcoming".
 * @property {string} link - The link to the session.
 * @property {string} timezone - The timezone of the session.
 * @property {number} timezoneOffset - The timezone offset in minutes.
 * @property {boolean} history - Whether the session is part of the history.
 */

const SessionInfoKeys = {
    "description": (val) => val || "My Meeting",
    "timezone": (val) => val || "UTC",
    "timezoneOffset": (val) => val || 0,
}
    


function toSessionLink(sid) {
    return `${window.location.origin}/V3/?${sid}`;
}

function toDateString(ds) {
    ds.setMinutes(ds.getMinutes() + ds.getTimezoneOffset());
    return `${ds.getDate()}/${ds.getMonth() + 1}/${ds.getFullYear()} ${ds.toLocaleTimeString("en", { timeStyle: "short" })}`;
}
function round(x, y) { return Math.round(Math.pow(10, y) * x) / Math.pow(10, y) }


/**
 * Parses a session object and returns a formatted session object.
 * @param {string} sid - The session ID.
 * @param {SessionDescriptor | SessionHistory} session - The session object to parse.
 * @param {boolean} [isHistory=false] - Whether the session is part of the history.
 * 
 * @returns {Session} The parsed session object with additional properties.
 */
export function parseSession(sid, session, isHistory = false) {
    let sessionData = {sid}

    let ds = new Date(isHistory ? session.startTime : session.info.scheduledTime);
    if (isHistory) ds.setMinutes(ds.getMinutes() + ds.getTimezoneOffset());
    sessionData.time = ds.getTime();
    sessionData.date = toDateString(ds);

    let duration = isHistory ? session.duration : session.info.duration;

    let isComplete = ((new Date()).getTime() > (ds.getTime() + duration)) || isHistory;
    sessionData.status = isComplete ? "complete" : "active";
    sessionData.history = isHistory;
    sessionData.link = toSessionLink(sid);
    let dminutes = round(parseFloat(duration), 0); // Convert duration from milliseconds to minutes
    let dhours = Math.floor(dminutes / 60);
    dminutes = dminutes % 60;
    sessionData.duration = Number.isNaN(dhours) ? "-" : `${dhours > 0 ? dhours + "h ":""}${dminutes}m`;

    const info = session.info || {};
  
    
    for (let key in SessionInfoKeys) {
        
        sessionData[key] = SessionInfoKeys[key](info[key]);
    }

    sessionData.active = false; // Default to false, will be updated later if needed

    return sessionData;
}

let watchers = {}

let UID = null;

/**
 * Watches the sessions for a user and updates the provided allData object with session information.
 * @param {string} uid - The user ID to watch sessions for.
 * @param {Object} allData - The object to store session data.
 * @param {Function} updateCallback - The callback function to call when session data is updated.
 * 
 * TODO: turn this into a async function that returns a promise that resolves when the data is ready
 * i.e. when all sessions have been loaded including their info.
 */
export function watch(uid, allData, updateCallback) {
    UID = uid;
    let activeSID = null;
    stopWatch();

    // If sessionsBySID does not exist, create it
    let format = () => {
        if (!("sessionsBySID" in allData)) {
            allData.sessionsBySID = {};
        }
    }

    // Create a sessions list and call the update callback
    let update = () => {
        allData.sessions = Object.values(allData.sessionsBySID).sort((a, b) => b.time - a.time);
        allData.sessions.forEach((session) => {
            session.status = session.sid === activeSID ? "active" : (session.history ? "complete" : "upcoming")});
        updateCallback();
    }

    // Start watching the info of a session
    let stopWatchSessionInfo = (sid) => {
        if (watchers[`session-${sid}`]) {
            watchers[`session-${sid}`]()
            delete watchers[`session-${sid}`];
        }
    }

    // Stop watching the info of a session
    let watchSessionInfo = (sid) => {
         watchers[`session-${sid}`] = onValue(ref(`sessions-v3/${sid}/info`), (snapshot) => {
            let info = snapshot.val();
            if (info !== null) {
                format();
                allData.sessionsBySID[sid] = parseSession(sid, {info});
                if (activeSID === sid) {
                    allData.sessionsBySID[sid].active = true;
                } else {
                    allData.sessionsBySID[sid].active = false;
                }
                update();
            }
        })
    }

    watchers.activeSessions = onValue(ref(`users/${uid}/active-session`), (snapshot) => {
        activeSID = snapshot.val();
        console.log("Active session ID:", activeSID);
        
        format();
        if (activeSID && activeSID in allData.sessionsBySID) {
            allData.sessionsBySID[activeSID].active = true;
        } else {
            // Set all sessions to inactive
            for (let sid in allData.sessionsBySID) {
                allData.sessionsBySID[sid].active = false
            }
        }
        update();
    });

    // Watch for session history updates
    watchers.sessionHistory = onValue(ref(`users/${uid}/session-history`), (snapshot) => {
        let sessionHistory = snapshot.val();
        format();
        for (let sid in sessionHistory) {
            allData.sessionsBySID[sid] = parseSession(sid, sessionHistory[sid], true);
        }
        update();
    });

    // Any time a session is added to all sessions that the user 
    // is the host of, start watching it's info
    let q = query(ref(`sessions-v3`), orderByChild("hostUID"), equalTo(uid))
    watchers.sessionAdded = onChildAdded(q, (snapshot) => {
        let sid = snapshot.key;
        watchSessionInfo(sid);
    })

    // Any time a session is removed from all sessions that the user
    // is the host of, stop watching it's info and remove it from the list
    watchers.sessionAdded = onChildRemoved(q, (snapshot) => {
        let sid = snapshot.key;
        stopWatchSessionInfo(sid);
        format();
        if (sid in allData.sessionsBySID) {
            delete allData.sessionsBySID[sid];
            update();
        }
    })
}

export function stopWatch() {
    // Stop all watchers
    for (let key in watchers) {
        watchers[key]();
        delete watchers[key];
    }
}

export async function createSession(sessionInfo) {
    sessionInfo = sessionInfo || {};
    let res = await callFunction("sessions-create", {startTime: sessionInfo.scheduledTime || (new Date()).getTime()}, "australia-southeast1");
    let {sid, errors} = res.data
    if (errors.length > 0) {
        console.log(errors);
        sid = null
    } else {
        await update(ref(`sessions-v3/${sid}/info`), sessionInfo)
    }
    return sid;
}

export async function deleteSession(sid) {
    await callFunction("sessions-end", {sid:sid}, "australia-southeast1");
    // await set(ref(`users/${UID}/session-history`), null);
}

export async function updateSession(sid, sessionInfo) {
    await update(ref(`sessions-v3/${sid}/info`), sessionInfo);
}