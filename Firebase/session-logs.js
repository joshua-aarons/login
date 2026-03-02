import { ref, onValue } from  "./firebase-client.js"

let watchers = [];

export function watch(uid, allData, updateCallback) {
    let end = onValue(ref(`users/${uid}/profile-logs`), (snapshot) => {
        let sessionLogs = snapshot.val();
        allData.sessionLogs = sessionLogs;
        updateCallback();
    })
    watchers.push(end);
}

export function stopWatch() {
    for (const end of watchers) {
        end();
    }
    watchers = [];
}