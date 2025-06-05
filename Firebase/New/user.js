import { equalTo, get, onChildAdded, onChildRemoved, onValue, orderByChild, query, ref, update } from "../firebase-client.js";


let watchers = {};

export function stopWatch() {
    for (let key in watchers) {
        watchers[key]();
        delete watchers[key];
    }
}

/**
 * Watches the user data of a user and updates the provided allData object.
 * @param {string} uid - The user ID to watch licences for.
 * @param {Object} allData - The object to store licence data.
 * @param {Function} updateCallback - The callback function to call when licence data is updated.
 */
export function watch(uid, allData, updateCallback) {
    // Stop all previous watchers
    stopWatch();

    


    // Watch the user data
    watchers[`user-${uid}-info`] = onValue(ref(`users/${uid}/info`), (snapshot) => {
        let userData = snapshot.val();
        if (userData) {
            allData.info = userData;
        } else {
            allData.info = null; // If user data is null, set it to null
        }
        updateCallback();
    });

    
}