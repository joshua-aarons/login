import {getUser, onValue, ref, update, uploadFileToCloud } from "../firebase-client.js";


let userInfo = null;
let watchers = {};
let gettingInfo = null;
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
    gettingInfo = new Promise((resolve) => {
        watchers[`user-${uid}-info`] = onValue(ref(`users/${uid}/info`), (snapshot) => {
            let userData = snapshot.val();
            if (userData) {
                allData.info = userData;
            } else {
                allData.info = null; // If user data is null, set it to null
            }
            userInfo = userData;
            updateCallback();
            resolve();
        });
    });
}


function getUserRef(path) {
    let r = null
    let user = getUser();
    if (user) {
        path = typeof path === "string" ? "/" + path : "";
        r = ref('users/' + user.uid + path);
    }
    return r
}

export async function setUserInfo(info) {
    let infoRef = getUserRef("info");
    if (infoRef) {
        await update(infoRef, info);
    }
}

export async function getUserInfo() {
    await gettingInfo;
    return userInfo;
}

export async function updateDisplayPhoto(file, callback) {
    let url = await uploadFileToCloud(file, `users/${User.uid}/displayPhoto`)
    setUserInfo({ displayPhoto: url })
}