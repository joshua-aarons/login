import {SettingOptions, SettingsFrame} from "https://v3.squidly.com.au/src/Features/Settings/settings-base.js"
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
const allSettings = [...sessionSettings, ...profileSettings];




/** @type {Object<string, SettingsFrame>} */
const settingsFrames = {};

/** @type {?FirebaseFrame} */
let rootFrame = null;




function detachSettingsFrame(path, isUpdate=true) {
    if (path in settingsFrames) {
        let frame = settingsFrames[path];
        frame.dispose();
        delete settingsFrames[path];
        if (isUpdate)
            callUpdate();
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
    const frame = new SettingsFrame(new FirebaseFrame(framePath), settingsOptions);
    settingsFrames[framePath] = frame
    frame.delete = () => {
        detachSettingsFrame(framePath);
        set(ref(framePath), null);
    }
    frame.framePath = framePath;
    frame.isDefault = framePath.endsWith("/default");
    callUpdate();
}


addAuthChangeListener((user) => {
    if (user) {
        let uid = user.uid;
        if (rootFrame && uid !== rootFrame.profilesUID) {
            rootFrame.close();
            rootFrame = null;
        }

        if (!rootFrame) {
            detachAll();

            let path = `users/${uid}/settings`;
            rootFrame = new FirebaseFrame(path);
            rootFrame.profilesUID = uid;

            // createSettingsFrame(path + "/host");
            createSettingsFrame(path + "/default", sessionSettings);

            rootFrame.onChildAdded("profiles", (childSnap, key) => {
                let framePath = path + "/profiles/" + key;
                createSettingsFrame(framePath);
            });
            rootFrame.onChildRemoved("profiles", (childSnap, key) => {
                detachSettingsFrame(path + "/profiles/" + key)
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



export function onSettingsUpdate(callback) {
    if (callback instanceof Function)
        updateCallbacks.push(callback);
}


export function addSettingsFrame() {
    if (rootFrame) {
        let sfid = rootFrame.push("profiles");
        let path = rootFrame.rootPath + "/profiles/" + sfid;
        createSettingsFrame(path);
    }
}

export function getSettingsFrame(path) {
    if (!(path in settingsFrames)) {
       return null;
    }
    return settingsFrames[path];
}

export function getAllSettingsFrames() {
    return Object.keys(settingsFrames);
}