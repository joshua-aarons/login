import { ref, onValue } from  "./firebase-client.js"

let watchers = [];

export function watch(uid, allData, updateCallback) {
    let end = onValue(ref(`users/${uid}/profile-logs`), (snapshot) => {
        let sessionLogs = snapshot.val();

        for (let pid in sessionLogs) {
            let lastDuration = 0
            let lastTime = null;
            let last = null;
            let profileLogs = sessionLogs[pid];

            for (let sid in profileLogs) {
                let slogs = profileLogs[sid];

                let duration = slogs.metadata.duration || 0;

                let totalInteractions = {
                    host: {click: 0, dwell: 0, switch: 0, total: 0},
                    participant: {click: 0, dwell: 0, switch: 0, total: 0},
                }

                if (slogs.appsInfo) {
                    for (let [appName, appData] of slogs.appsInfo) {
                        for (let user in totalInteractions) {
                            let uInts = appData[user].interactions || {};
                            for (let intType in uInts) {
                                totalInteractions[user][intType] += uInts[intType];
                                totalInteractions[user].total += uInts[intType];
                            }
                        }
                    }
                }
                let all = totalInteractions.host.total + totalInteractions.participant.total;
                totalInteractions.participation = totalInteractions.participant.total / (all > 0 ? all : 1);
                slogs.totals = totalInteractions;
                if (last) {
                    slogs.deltas = {
                        duration: duration - lastDuration,
                        host: {
                            click: totalInteractions.host.click - last.host.click,
                            dwell: totalInteractions.host.dwell - last.host.dwell,
                            switch: totalInteractions.host.switch - last.host.switch,
                            total: totalInteractions.host.total - last.host.total,
                        },
                        participant: {
                            click: totalInteractions.participant.click - last.participant.click,
                            dwell: totalInteractions.participant.dwell - last.participant.dwell,
                            switch: totalInteractions.participant.switch - last.participant.switch,
                            total: totalInteractions.participant.total - last.participant.total,
                        },
                        participation: totalInteractions.participation - (last.participation || 0),
                        comparedTo: lastTime,
                    }

                }
                lastTime = slogs.metadata?.time; 
                last = totalInteractions;
                lastDuration = duration;
            }
        }
        console.log(sessionLogs)

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