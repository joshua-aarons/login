import { callFunction, equalTo, get, onChildAdded, onChildRemoved, onValue, orderByChild, query, ref, update } from "../firebase-client.js";



const isEditorStatus = {
    "admin": true,
    "owner": true,
}
const usageKeys = [
    "minutes",
    "sessions",
    "storage",
]
const tierNames = {
    "0": "Free",
    "1": "Basic",
    "2": "Plus",
    "3": "Pro",
}
let watchers = {};

function round(x, y) { return Math.round(Math.pow(10, y) * x) / Math.pow(10, y) }


/**
 * Watches the licences of a user and updates the provided allData object.
 * @param {string} uid - The user ID to watch licences for.
 * @param {Object} allData - The object to store licence data.
 * @param {Function} updateCallback - The callback function to call when licence data is updated.
 * 
 * TODO: turn this into a async function that returns a promise that resolves when the data is ready
 * i.e. whel all licences have been loaded including their status and user data is available
 */
export function watch(uid, allData, updateCallback) {
    // Stop all previous watchers
    stopWatch();

    allData.usage = {
        minutes: { used: 0, max: 0, "%": 0, remaining: 0 },
        sessions: { used: 0, max: 0, "%": 0, remaining: 0 },
        storage: { used: 0, max: 0, "%": 0, remaining: 0 },
        hours: { used: 0, max: 0, "%": 0, remaining: 0 }, // Added hours usage
    }

    let tierSettings = null;
    let waitingForTierValues = new Promise((resolve) => {
        watchers.tierSettings = onValue(ref(`licences-settings/tiers`), (snapshot) => {
            tierSettings = snapshot.val();
            resolve();
        });
    });

    let updateUsagePercentages = () => {
        for (let key in allData.usage) {
            // let dp = key === "minutes" ? 0 : 2; // Use 0 decimal places for minutes, 2 for others
            allData.usage[key]["%"] = allData.usage[key].max > 0 ? round(allData.usage[key].used / allData.usage[key].max, 2) : 0;
            allData.usage[key].remaining = round((allData.usage[key].max - allData.usage[key].used), key === "minutes" ? 0 : 2); // Use 0 decimal places for minutes, 2 for others
        }
    }

    let updateMaxUsage = async (licences) => {    
        await waitingForTierValues; // Ensure tierSettings is loaded before processing licences
        let usage = {minutes: 0, sessions: 0, storage: 0};
        for (let tier of licences) {
            let tierUsage = tierSettings[tier]?.usage || {};
            for (let key in usage) {
                if (key in tierUsage) {
                    usage[key] += tierUsage[key];
                }
            }
        }
        for (let key of usageKeys) {
            allData.usage[key].max = round(usage[key], key=="minutes"?0:2); // Ensure max is a number with 2 decimal places
        }
        allData.usage.hours.max = round(usage.minutes / 60, 2);
        updateUsagePercentages();
    }

    watchers[`user-${uid}-usage`] = onValue(ref(`users/${uid}/usage`), async (snapshot) => {
        let usageData = snapshot.val() || {};
        for (let key of usageKeys) {
            allData.usage[key].used = round(usageData[key] || 0, key == "minutes" ? 0 : 2) // Ensure used is a number with 2 decimal places
        }
        allData.usage.hours.used = round(allData.usage.minutes.used / 60, 2); // Calculate hours used
        updateUsagePercentages();
        updateCallback();
    })

    let listenToLicence = (licenceID, remove = false) => {
        if (remove) {
            if (watchers[licenceID]) {
                watchers[licenceID]();
                delete watchers[licenceID];
            }
        } else {
            watchers[licenceID] = onValue(ref(`licences/${licenceID}`), (snapshot) => {
                let licenceData = snapshot.val();
                if (licenceData) {
                    licenceData.id = licenceID; // Add licence ID to the data
                    if (!("licencesByID" in allData)) {
                        allData.licencesByID = {};
                    }
                    allData.licencesByID[licenceID] = licenceData;
                } else {
                    // If licence data is null, remove it from licencesByID
                    if ("licencesByID" in allData) {
                        delete allData.licencesByID[licenceID];
                    }
                }
                allData.licences = Object.values(allData.licencesByID || {});
                updateCallback();
            });
        }
    }

    let listenToStatus = (licenceID) => {
        let watchStatusKey = `${licenceID}-status`;
        if (!watchers[watchStatusKey]) {
            watchers[watchStatusKey] = onValue(ref(`licences/${licenceID}/users/${uid}/status`), (snapshot) => {
                let status = snapshot.val();
                if (!("licenceStatus" in allData)) {
                    allData.licenceStates = {};
                }
                allData.licenceStates[licenceID] = status;
                listenToLicence(licenceID, !(status in isEditorStatus)); // Remove the licence watcher
                updateCallback();
            });
        }
    }

    watchers.userLicences = onValue(ref(`users/${uid}/licences`), async (snapshot) => {
        let licences = snapshot.val() || {};
        if (!("licenceTiers" in allData)) {
            allData.licenceTiers = {};
        }
        await updateMaxUsage(Object.values(licences));
        for (let licenceID in licences) {
            allData.licenceTiers[licenceID] = licences[licenceID];
            listenToStatus(licenceID);
        }
        // Compute the maximum tier
        allData.maxTier = Math.max(...Object.values(allData.licenceTiers)) || 0;
        allData.tierName = tierNames[allData.maxTier] || "None";
        updateCallback();
    });
}

/**
 * Stops all watchers for licences.
 */
export function stopWatch() {
    // Stop all watchers
    for (let key in watchers) {
        watchers[key]();
        delete watchers[key];
    }
}

export async function addUsersToLicence(lid, users) {
    let res = await Promise.all(
        users.map(async user => {
            let r = await callFunction("licences-addUser", {user, lid}, "asia-southeast1");
            return r.data;
        })
    );
    return res;
}
export async function removeUsersFromLicence(lid, users) {
    let res = await Promise.all(
        users.map(async user => {
            user.email = user.email.toLowerCase(); // Ensure email is lowercase
            console.log(`Removing user ${user.name} from licence ${lid}: \n ${JSON.stringify(user, null, "\t")}`);
            let r = await callFunction("licences-removeUser", {user, lid}, "asia-southeast1");
            return r.data;
        })
    );
    return res;
}