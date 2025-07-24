/**
 * @typedef {Object} SessionInfo
 * @property {number} startTime - The session ID.
 * @property {string} description - The session description.
 * @property {string} startDate - The session start date in the format "DD/MM/YYYY HH:MM AM".
 * @property {number} duration - The session duration in minutes.
 * 
 */

import { callFunction, equalTo, get, getUser, onChildAdded, onChildRemoved, onValue, orderByChild, query, ref, set, update } from "./firebase-client.js";
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





function round(x, y) { return Math.round(Math.pow(10, y) * x) / Math.pow(10, y) }


const SessionInfoKeys = {
    "description": (val) => val || "My Meeting",
    "startTime": (val) => typeof val === "number" && !Number.isNaN(val) ? new Date(val) : null,
    "startDate": (val) => typeof val === "string" ? val : null,
    "duration": (val) => typeof val === "number" && !Number.isNaN(val) ? Math.round(val) : 5, // Convert milliseconds to minutes
    "timezone": (val) => typeof val === "string" ? val : "-",
}

const oldMode = false;
    
class Session {
    /**
     * @type {number} timestamp in milliseconds 
     **/
    startTime = null;

    /**
     * @type {number} duration in minutes
     **/
    duration = 5;

    /**
     * @type {string} date in the format "YYYY-MM-DDTHH:MMZ"
     **/
    startDate = null;

    /**
     * @type {string}
     **/
    description = "My Meeting";

    /**
     * @type {string}
     **/
    sid = null;

    /**
     * @type {string}
     **/
    timezone = "-";

    /**
     * @type {number} timezone offset in minutes
     **/
    timezoneOffset = 0;

    /**
     * @type {boolean} is this session in the past?
     **/
    isHistory = false;

    /**
     * @type {boolean} is this session currently active?
     **/
    active = false;

    constructor(sid, session, isHistory = false) {
        if (oldMode) {
            if (!session.info) {
                session.info = {duration: 5, description: "My Meeting", startTime: Date.now(), startDate: new Date().toISOString()};
            }
        }
        
        if (typeof sid !== "string" || sid.length === 0) {
            throw new Error("Session ID must be a non-empty string");
        } else if (session === null || typeof session !== "object") {
            throw new Error("Session data must be a non-null object");
        } else if (!("info" in session) || typeof session.info !== "object") {  
            throw new Error("Session data must contain an 'info' object");
        } 

        this.sid = sid;
        for (let key in SessionInfoKeys) {
            let value = SessionInfoKeys[key](session.info[key]);
            if (value === null || value === undefined) {
                throw new Error("Session info is missing required key: " + key);
            } else {
                this[key] = value;
            }
        }
      

        if (isHistory) {
            this.scheduledTime = this.startTime;
            this.scheduledDuration = this.duration;
            this.startTime = session.startTime;
            this.duration = Math.round(session.duration);
        }
        this.isHistory = isHistory;
        this.active = false;
        this.timezoneOffset = Session.gettimezoneOffset(this.startDate);

        let ds = new Date(this.startTime);
        this.date = `${ds.getDate()}/${ds.getMonth() + 1}/${ds.getFullYear()} ${ds.toLocaleTimeString("en", { timeStyle: "short" })}`;
    }

    async delete(){
        if (this.isHistory) {
            let uid = getUser().uid;
            let r = ref(`users/${uid}/session-history/${this.sid}`);
            await set(r, null);
        } else {
            await deleteSession(this.sid);
        }
        return true;
    }

    /**
     * @returns {string} The session link.
     */
    get link() {
        return Session.sid2link(this.sid);
    }

    /**
     * @returns {("active"|"complete"|"upcoming")} The session status.
     */
    get status() {
        if (this.active) {
            return "active";
        } else if (this.isHistory) {
            return "complete";
        } else {
            return "upcoming";
        }
    }

    /**
     * @returns {number} The rank of the session status.
     * - "active" has the highest rank (2)  
     * - "upcoming" has a middle rank (1)
     * - "complete" has the lowest rank (0)
     * - Unknown status has a rank of -1
     */
    get statusRank() {
        switch (this.status) {
            case "active":
                return 2;
            case "complete":
                return 0;
            case "upcoming":
                return 1;
            default:
                return -1; // Unknown status
        }
    }

    compare(other) {
        if (this.status === other.status) {
            return this.startTime - other.startTime;
        } else {
            return this.statusRank - other.statusRank;
        }
    }

    /**
     * @returns {number} The session time in milliseconds.
     */
    get time() {
        return this.startTime;
    }

    static sid2link(sid) {
        return `${window.location.origin}/V3/?${sid}`;
    }

    static gettimezoneOffset(date) {
        let match = date.match(/[+-]\d{2}:\d{2}/);
        if (match) {
            let offset = match[0];
            let hours = parseInt(offset.slice(1, 3), 10);
            let minutes = parseInt(offset.slice(4, 6), 10);
            return (hours * 60 + minutes) * (offset[0] === '+' ? -1 : 1);
        } else {
            return 0; // Default to no offset if not found
        }
    }

    static createEmptySessionInfo() {
        return{
            startTime: Date.now(),
            duration: 5,
            description: "My Meeting",
            startDate: new Date().toISOString(),
            timezone: "Sydney, Melbourne, Canberra",
        }
    }
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
    let sessionHistoryData = {};
    let sessionsData = {};

    stopWatch();

    // If sessionsBySID does not exist, create it
    let format = () => {
        if (!("sessionsBySID" in allData)) {
            allData.sessionsBySID = {};
        }
    }

    // Create a sessions list and call the update callback
    let update = () => {
        allData.sessionsBySID = {...sessionsData, ...sessionHistoryData};
        let sessions = Object.values(allData.sessionsBySID);
        sessions.sort((a, b) => b.compare(a));
        allData.sessions = sessions;
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
            try {
                let sdata = new Session(sid, {info: snapshot.val()});
                format();
                if (activeSID === sid) {
                    sdata.active = true;
                } else {
                    sdata.active = false;
                }
                // allData.sessionsBySID[sid] = sdata;
                sessionsData[sid] = sdata;
                update();
            } catch (e) {}
        })
    }

    watchers.activeSessions = onValue(ref(`users/${uid}/active-session`), (snapshot) => {
        activeSID = snapshot.val();
        console.log("Active session ID:", activeSID);
        
        format();
        // Set all sessions to inactive
        for (let sid in allData.sessionsBySID) {
            allData.sessionsBySID[sid].active = false
        }

        if (activeSID && activeSID in allData.sessionsBySID) {
            allData.sessionsBySID[activeSID].active = true;
        }
        update();
    });

    // Watch for session history updates
    watchers.sessionHistory = onValue(ref(`users/${uid}/session-history`), (snapshot) => {
        let sessionHistory = snapshot.val();
        format();
        sessionHistoryData = {};
        for (let sid in sessionHistory) {
            try {    
                let sdata = new Session(sid, sessionHistory[sid], true);
                sessionHistoryData[sid] = sdata;
            } catch (e) {}
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
        if (sid in sessionsData) {
            delete sessionsData[sid];
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
    if (sessionInfo === "empty") {
        sessionInfo = Session.createEmptySessionInfo();
    } else if (typeof sessionInfo !== "object" || sessionInfo === null) {
        throw new Error("Session info must be a non-null object");
    }

    
    let res = await callFunction("sessions-create", sessionInfo, "australia-southeast1");
    
    let {sid, errors} = res.data
    if (errors.length > 0) {
        console.log(errors);
        sid = null
    } else {
        await update(ref(`sessions-v3/${sid}/info`), sessionInfo)
    }

    return new Session(sid, {
        info: sessionInfo,
    });
}

export async function deleteSession(sid) {
    
    await callFunction("sessions-end", {sid:sid}, "australia-southeast1");
    // await set(ref(`users/${UID}/session-history`), null);
}

export async function updateSession(sid, sessionInfo) {
    await update(ref(`sessions-v3/${sid}/info`), sessionInfo);

    return new Session(sid, {
        info: sessionInfo,
    });
}