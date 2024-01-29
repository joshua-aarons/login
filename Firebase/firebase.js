import { firebaseConfig} from "./firebase-config.js"
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import { signOut, getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential, updatePassword, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
import { getDatabase, child, push, ref as _ref, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, update, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js'
import {getStorage, ref as sref, uploadBytes, uploadBytesResumable, getDownloadURL} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-storage.js'

let initialised = false;
let userInitialised = false;
let App = null;
let Database = null;
let Auth = null;
let User = null;
let StateListeners = [];
const SESSION_ROOT_KEY = "meetings";

// Generates a random key to use as the device's unique identifier DUID.
function makeRandomKey() {
    return (Math.round(Math.random() * 100000)).toString(32) + Math.round(performance.now() * 1000).toString(32) + (Math.round(Math.random() * 100000)).toString(32);
}

/* If a DUID already exists in local storage retreive that key otherwise generate a new key 
   and store in local storage. */
let DUID = localStorage.getItem('duid');
if (DUID == null) {
    DUID = makeRandomKey();
    localStorage.setItem('duid', DUID);
}

/* If the user has changed updates the new user and calls all listeners with the new user data.
   If a listener returns the string "remove" then the listener will be removed */
async function authChangeHandler(user) {
    // If the user has changed to or from null OR a new user has logged in
    if (((user == null) != (User == null)) || (user != null && User != null && user.uid != user.uid) || !userInitialised) {
        // Update the user object
        User = user;
        if (User != null) watchData();
        let newListeners = [];
        // Call listeners with the new user
        for (let obj of StateListeners) {
            if (obj instanceof Function) {
                if (obj(user) != "remove") newListeners.push(obj);
            } else if (typeof obj === 'object' && obj !== null) {
                if (obj.onauthchange instanceof Function) {
                    if (obj.onauthchange(user) != "remove") newListeners.push(obj);
                }
            }
        }
        StateListeners = newListeners;
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ PUBLIC FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/*  Initialize firebase, initializes the firebase app with the given configuration
    after initializing wait for an auth state change and return */
export async function initialise(config = firebaseConfig) {
    if (initialised) return;
    initialised = true;
    App = initializeApp(config);
    Database = getDatabase(App);
    Auth = getAuth();
    return new Promise((resolve, reject) => {
        onAuthStateChanged(Auth, async (userData) => {
            console.log("auth state change: user data", userData);
            if (!userInitialised) {
                resolve();
            }
            authChangeHandler(userData);
            userInitialised = true;
        });
    });
}

//  Add an auth state change listener
export function addAuthChangeListener(obj) {
    StateListeners.push(obj);
}

// Get user uid, if none exists then the DUID is returned instead
export function getUID() {
    let uid = DUID;
    if (User != null && typeof User !== "string") {
        uid = User.uid;
    }
    console.log(User);
    return uid;
}

// Get user data object
export function getUser() { return User; }

// Get App object
export function getApp() { return App; }

// Get Database object
export function getDB() { return Database; }

// Get Ref using database
export function ref(path) { return _ref(Database, path); }




function getUserRef(path) {
    let r = null
    if (User && Database){
        path = typeof path === "string" ? "/" + path : "";
        r = ref('users/' + User.uid + path);
    }
    return r
}

async function getUserData(path) {
    let userData = null;
    if (User) {
        let sc = await get(infoRef);
        userData = sc.val();
    }
    return userData;
}
export async function setUserInfo(info) {
    if (User) {
        let infoRef = ref('users/' + User.uid + '/info');
        await update(infoRef, info);
    }
}


class LoginError extends Error {
    constructor(error) {
        let inputName = "";
        let errorCode = error;
        if (error.code) errorCode = error.code;
        // Display the error message
        let message = "";
        switch (errorCode) {
            case "auth/invalid-login-credentials":
                message = "wrong email and/or password";
                break;

            case "auth/invalid-email":
                message = "wrong email";
                inputName = "email";
                break;

            case "auth/wrong-password":
                message = "wrong password";
                inputName = "password";
                break;

            // TODO: Check other errors
            default:
                message = errorCode;
                break;

        }
        super(message);
        this.inputName = inputName;
    }
}


export async function signin(type, info) {
    switch (type) {
        case "email":
            let { email, password } = info;
            try {
                await signInWithEmailAndPassword(Auth, email, password);
            } catch (error) {
                throw new LoginError(error);
            }
            break;

        case "gmail":
            const provider = new GoogleAuthProvider();
            console.log(Auth);
            signInWithRedirect(Auth, provider);
            break;

        case "facebook":
            throw new LoginError("Facebook has not yet been setup.");
    }
}

export async function signup(type, info) {
    switch (type) {
        case "email":
            let { email, password } = info;
            delete info.email;
            delete info.password;
            try {
                // Register user
                await createUserWithEmailAndPassword(Auth, email, password);
                let user = Auth.currentUser;

                // Set user info
                setUserInfo(info);

                // Send email verification
                const actionCodeSettings = {
                    url: window.location.origin,
                    handleCodeInApp: true
                };
                await sendEmailVerification(user, actionCodeSettings);
            } catch (error) {
                throw new LoginError(error);
            }
            break;

        case "gmail":
            const provider = new GoogleAuthProvider();
            signInWithRedirect(Auth, provider);
            break;

        case "facebook":
            throw new LoginError("Facebook has not yet been setup.");
    }
}

export function signout() { signOut(Auth) }

function getSessionRef(sessionID, path) {
    let sref = null;
    if (Database != null) {
        if (typeof sessionID === "string") {
            sref = ref(SESSION_ROOT_KEY + "/" + sessionID);
            if (typeof path === "string") sref = child(sref, path);
        } else {
            sref = push(ref(SESSION_ROOT_KEY));
        }
    }
    return sref;
}

/* Make session creates a new session signaling channel in the database
   returns the new session key */
export async function makeSessionKey() {
    let key = null;
    let sessionRef = getSessionRef();
    try {
        key = sessionRef.key;
        await set(child(sessionRef, "hostUID"), getUID());
    } catch (e) {
        console.log(e);
        key = null;
    }

    return key;
}

async function resetPassword(data) {
    let credentials = EmailAuthProvider.credential(User.email, data.oldpasscode)
    await reauthenticateWithCredential(User, credentials)
    await updatePassword(User, data.newpasscode)
}

let DataListeners = []
let OldData = null
export function addDataListener(obj) {
    if (obj instanceof Function){
        DataListeners.push(obj);
        if (OldData) {
            obj(parseData(OldData));
        }
    }
}

function updateDataListeners(sc) {
    OldData = sc
    for (let listener of DataListeners){
        listener(parseData(sc))
    }
}

let FirebaseDataListeners = []
function watchData() {
    stopWatch()
    if (Database && User != null){
        let userInfoRef = getUserRef()
        onValue(userInfoRef, (value) => {
            updateDataListeners(value)
        })
    }
}


const TIERS = {
    Standard: {
        hours: 50,
        'sessions-count': 20,
        storage: 300
    },
    None: {
        hours: 0,
        'sessions-count': 0,
        storage: 0,
    }
}
//  userData["sessions-count"] = userData.sessions.length
//     let mins = 0
//     for (let d of userData.sessions.map(s => s.duration))
//         mins += d

//     userData.hours = Math.round(mins/6)/10

   
const DATA_PARSERS = [
    {
        name: "info",
        parse: (info) => {
            if (info == null) {
                info = {
                    firstName: "",
                    lastName: "",
                    displayName: User.displayName,
                }
                setUserInfo(info);
            } else {
                info.email = User.email
                if (!info.displayName || info.displayName == '')
                    info.displayName = info.firstName + ' ' + info.lastName

                if (!info.displayPhto) info.displayPhto = User.photoURL

                if (!info.optionalData) info.optionalData = false;
            }
            return info;
        },
    },
    {
        name: "licence",
        parse: (licence, data) => {
            if (licence == null) {
                licence = {
                    tier: "None"
                };
            }


            //calculate total usage
            let total = {
                hours: 0,
                'sessions-count': 0,
                storage: 0
            };
            if (data.sessios) {
                for (let s of data.sessions) {
                    total.hours += s.duration / 60;
                    total['sessions-count'] += 1;
                }
            }

            let max = TIERS[licence.tier];
            let percent = {}
            for (let key in max) {
                percent[key] = max[key] == 0 ? 1 : total[key] / max[key];
            }

            licence.max = max;
            licence.total = total;
            licence["%"] = percent;
            return licence;
        }
    },

]
function parseData(sc) {
    let data = sc.val()
    if (data == null) {
       data = {};
    }

    for (let dp of DATA_PARSERS) {
        let value = dp.name in data ? data[dp.name] : null;
        data[dp.name] = dp.parse(value, data);
    }
    
    return data
}

function stopWatch() {
    for (let listener of FirebaseDataListeners){
        listener()
    }
}

export async function sendSupportMessage(message, progress) {
    return new Promise((resolve, reject) => {
        let i = 0;
        let id = setInterval(() => {
            i++;
            if (progress instanceof Function) {
                progress(i / 100);
            }

            if (i == 100) {
                clearInterval(id);
                resolve(true);
            }
        }, 50)
    })
}

// Upload file to firebase storage bucket
async function uploadFileToCloud(file, path, statusCallback){
    console.log("HERE");
    let Storage = getStorage(App, "gs://eyesee-d0a42.appspot.com");

    // path = `${path}`
    console.log("uploading file of size", (file.size/1e6) + "MB");
  
    if ( !(file instanceof File) || typeof path !== 'string' ){
      console.log('invalid file');
      return null;
    }
  
    let sr = sref(Storage, path);
  
    let uploadTask = uploadBytesResumable(sr, file);
    console.log(uploadTask);
    uploadTask.on('next', statusCallback)
    await uploadTask;
  
    let url = await getDownloadURL(sr);
    return url;
  }
  

export { child, get, push, set, onChildAdded, onValue, resetPassword }


