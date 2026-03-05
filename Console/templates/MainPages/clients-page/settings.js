import {SettingOptions, SettingsFrame, SettingsDescriptor} from "./settings-base.js"
import { FirebaseFrame } from "../../../../Firebase/firebase-frame.js";
import { ref, set, addAuthChangeListener } from "../../../../Firebase/firebase-client.js";


const sessionSettings = SettingOptions.map(option => {
    let newOption = {...option};
    newOption.key = newOption.key.slice(1);
    return newOption;
})

const profileSettings = [
    {
        key: ["profileSettings", "name"],
        type: "string",
        default: "Untitled Profile",
    },
    {
        key: ["profileSettings", "image"],
        type: "file",
        fileType: "image/*",
        maxSize: 1024 * 1024, // 1 MB
        default: null,
    }
];

const allSettings = [ ...profileSettings, ...sessionSettings];


/** @type {Object<string, SettingsFrame>} */
const settingsFrames = {};

function detachSettingsFrame(frameID, isUpdate=true) {
    if (frameID in settingsFrames) {
        let frame = settingsFrames[frameID];
        delete settingsFrames[frameID];
        frame.dispose();
        if (isUpdate) {
            callUpdate();
        }
    }
}

function detachAll() {
    for (let path of Object.keys(settingsFrames)) {
        detachSettingsFrame(path, false);
    }
    callUpdate();
}

function createSettingsFrame(framePath, settingsOptions=allSettings) {
    if (framePath in settingsFrames) {
        return;
    }

    const frameID = framePath.split("/").slice(-1)[0];

    const frame = new SettingsFrame(new FirebaseFrame(framePath), settingsOptions);
    settingsFrames[frameID] = frame;
    frame.delete = async () => {
        console.log("Deleting frame at path:", framePath);
        await set(ref(framePath), null);
    }
    frame.framePath = framePath;
    frame.isDefault = framePath.endsWith("/default");
    frame.id = frameID;
    callUpdate();
}

/** @type {?FirebaseFrame} */
let rootFrame = null;
addAuthChangeListener((user) => {
    if (user) {
        let uid = user.uid;
        if (rootFrame && uid !== rootFrame.profilesUID) {
            rootFrame.close(false); // DO NOT DELETE DATA
            rootFrame = null;
            detachAll();
            console.log(settingsFrames)
        }

        if (!rootFrame) {
            detachAll();

            let path = `users/${uid}/settings`;
            rootFrame = new FirebaseFrame(path);
            rootFrame.profilesUID = uid;

            createSettingsFrame(path + "/default", sessionSettings);

            rootFrame.onChildAdded("profiles", (_, key) => {
                createSettingsFrame(path + "/profiles/" + key);
            });

            rootFrame.onChildRemoved("profiles", (_, key) => {
                detachSettingsFrame(key)
            });
        }
    }
});

const updateCallbacks = [];
 
function callUpdate() {
    for (let callback of updateCallbacks) {
        callback();
    }
}

/**
 * Registers a callback function to be called whenever the settings are updated.
 * The callback function should take no arguments and will be called whenever a settings frame is added, removed, or updated.
 * @param {Function} callback - The function to call when the settings are updated
 */
export function onSettingsUpdate(callback) {
    if (callback instanceof Function) {
        updateCallbacks.push(callback);
        callUpdate();
    }
}

/**
 * Creates a new SettingsFrame for a given profile ID (path) 
 * and adds it to the list of settings frames,
 */
export async function addSettingsFrame() {
    let pid = null;
    if (rootFrame) {
        pid = rootFrame.push("profiles");
        let path = rootFrame.rootPath + "/profiles/" + pid;
        await set(ref(path), true);
    }

    return pid;
}

/**
 * Gets the SettingsFrame for a given path, or null if it does not exist
 * @param {string} profileID - The path of the settings frame to get
 * @return {SettingsFrame|null} The SettingsFrame for the given path, or null if it does not exist
 */
export function getSettingsFrame(profileID) {
    if (!(profileID in settingsFrames)) {
       return null;
    }
    return settingsFrames[profileID];
}

/**
 * Gets the list of all profile IDs (paths) for which SettingsFrames exist
 * @return {string[]} The list of all profile IDs (paths) for which SettingsFrames exist
 */
export function getAllSettingsFrameIDs() {
    return Object.keys(settingsFrames);
}

/**
 * Gets the list of all SettingsFrames
 * @return {SettingsFrame[]} The list of all SettingsFrames
 */
export function getAllSettingsFrames() {
    return Object.values(settingsFrames);
}



export {SettingsDescriptor}