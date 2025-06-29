import * as sessions from "./sessions.js";
import * as licences from "./licences.js";
import * as user from "./user.js";

/**
 * Watches the user's sessions and licences, and calls the callback with the updated data.
 * @param {string} uid - The user ID to watch sessions and licences for.
 * @param {Function} callback - The callback function to call when data is updated.
 */
export async function watch(uid, callback) {
    let allData = {};

    await Promise.all([
        // Watch sessions
        sessions.watch(uid, allData, () => callback(allData, "sessions")),

         // Watch licences
        licences.watch(uid, allData, () => callback(allData, "licences")),

        user.watch(uid, allData, () => callback(allData, "user"))
    ])


    return () => {
        // Stop watching sessions and licences
        sessions.stopWatch();
        licences.stopWatch();
    }
}