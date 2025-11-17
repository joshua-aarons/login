import { get, onValue, ref } from "./firebase-client.js";
import { Session } from "./sessions.js";

class UserObject {
    constructor(uid, data) {
        this.uid = uid;
        for (let key in data) {
            this[key] = data[key];
        }

        let sessionHistory = data["session-history"];
        let userSessions = Object.keys(sessionHistory || {}).map(sid => {
            let sessionData = sessionHistory[sid];
            try {
                return new Session(sid, sessionData, true, uid);
            } catch (e) {
                return null;
            }
        }).filter(s => s !== null);
        this.sessionHistory = userSessions;
    }

    get name() {
        return (this.info.displayName || "").trim() || (this.info.firstName + " " + this.info.lastName).trim() || "No Name";
    }

    get uidShort() {
        return this.uid.slice(0, 3) + "..." + this.uid.slice(-3);
    }

}
class MetricData {
    constructor() {
        this.__sessions = [];
        this.__users = [];
        this.__licences = [];
    }

    set _sessions(sessions) {
        let sessionsList = Object.keys(sessions || {}).map(sid => {
            let sessionData = sessions[sid];
            try {
                return new Session(sid, sessionData, false, sessionData.hostUID);
            } catch (e) {
                return null;
            }
        }).filter(s => s !== null);
        this.__sessions = sessionsList;
    }

    set _users(users) {
        let usersById = users || {};
        this.__users = Object.keys(users || {}).map(uid => {
            let userData = users[uid];
            let user = new UserObject(uid, userData);
            usersById[uid] = user;
            return user;
        });
        this.__usersById = usersById
    }

    set _licences(licences) {
        let licencesList = Object.keys(licences || {}).map(lid => {
            let licenceData = licences[lid];
            licenceData.lid = lid;
            return licenceData;
        });
        this.__licences = licencesList;
        this.__licencesById = licences;
    }

    get licencesById() {
        return this.__licencesById;
    }

    get licences() {
        return [...this.__licences];
    }



    /**
     * Get a list of all users
     * @returns {UserObject[]}
     */
    get users() {
        return [...this.__users];
    }

    /**
     * Get users grouped by UID
     * @returns {Object<string, UserObject>} An object where keys are user UIDs and values are UserObject instances
     */
    get usersById() {
        return this.__usersById;
    }

    /**
     * Get a list of all sessions
     * @returns {Session[]}
     */
    get allSessions() {
        return [...this.__users.map(user => user.sessionHistory).flat(), ...this.__sessions];
    }

    
    /**
     * Get sessions grouped by user UID
     * @returns {Object<string, Session>} An object where keys are user UIDs and values are arrays of Session objects
     */
    get sessionsByUser() {
        let sessionsByUser = {};
        for (let user of this.__users) {
            sessionsByUser[user.uid] = user.sessionHistory;
        }
        for (let session of this.__sessions) {
            if (!sessionsByUser[session.hostUID]) {
                sessionsByUser[session.hostUID] = [];
            }
            sessionsByUser[session.hostUID].push(session);
        }
        return sessionsByUser;
    }

}

async function onValueInitial(path, callback) {
    return new Promise(async (resolve) => {
        onValue(ref(path), (snapshot) => {
            callback(snapshot);
            resolve();
        });
    });
}

export async function watch(uid, allData, updateCallback) {
    allData.metrics = new MetricData();

    let snapshot = await get(ref("super-admin/" + uid));
    let isSuperAdmin = snapshot.exists() && snapshot.val() === true;
    let isReady = false;

    if (isSuperAdmin) {
        await Promise.all([
            onValue(ref(`sessions-v3`), (snapshot) => {
                let sessionsData = snapshot.val() || {};
                allData.metrics._sessions = sessionsData;
                if (isReady) updateCallback(allData, "metricData");
            }),
            onValue(ref("licences"), (snapshot) => {
                let licencesData = snapshot.val() || {};
                allData.metrics._licences = licencesData;
                if (isReady) updateCallback(allData, "metricData");
            })
        ]);
        onValue(ref("users"), (snapshot) => {
            let usersData = snapshot.val() || {};
            allData.metrics._users = usersData;
            isReady = true;
            updateCallback(allData, "metricData");
        })

    
    } else {
        console.warn("Access denied: User is not a super-admin");
    }
    return isSuperAdmin;
}