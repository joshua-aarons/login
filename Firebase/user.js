import {getUser, onValue, ref, set, update, uploadFileToCloud } from "./firebase-client.js";


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
 * 
 * TODO: turn this into a async function that returns a promise that resolves when the data is ready
 * i.e. when user data is loaded and available.
 */
export function watch(uid, allData, updateCallback) {
    // Stop all previous watchers
    stopWatch();


    // Watch the user data
    gettingInfo = new Promise((resolve) => {
        // Try to load from localStorage first for immediate display
        try {
            const cachedInfo = localStorage.getItem(`squidly_user_info_${uid}`);
            if (cachedInfo) {
                const userData = JSON.parse(cachedInfo);
                allData.info = userData;
                userInfo = userData;
                updateCallback();
            }
        } catch (e) {
            console.warn("Failed to load user info from cache", e);
        }

        watchers[`user-${uid}-info`] = onValue(ref(`users/${uid}/info`), (snapshot) => {
            let userData = snapshot.val() || {};
            
            // Cache the new data
            try {
                localStorage.setItem(`squidly_user_info_${uid}`, JSON.stringify(userData));
            } catch (e) {
                console.warn("Failed to cache user info", e);
            }

            allData.info = userData;
            if (!userData.firstName) {
                let user = getUser();
                let name = user.displayName || "User";
                let names = name.split(" ");
                userData.firstName = names[0];
                userData.lastName = names.length > 1 ? names.slice(1).join(" ") : "";
                userData.displayName = name;
                userData.email = user.email;
                setUserInfo({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    displayName: name,
                    email: user.email,
                });
            } else if (!userData.displayName) {
                let name = userData.firstName + " " + userData.lastName;
                userData.displayName = name;
                setUserInfo({
                    displayName: name,
                });
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
    const User = getUser();
    let url = await uploadFileToCloud(file, `users/${User.uid}/displayPhoto`)
    setUserInfo({ displayPhoto: url })
}