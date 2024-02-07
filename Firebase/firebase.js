import { firebaseConfig, storageURL } from "./firebase-config.js"
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import { signOut, getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification as _sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential, updatePassword, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
import { getDatabase, child, push, ref as _ref, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, update, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js'
import { getStorage, ref as sref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
import { getFunctions, httpsCallable  } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js'

let initialised = false;
let userInitialised = false;
let App = null;
let Database = null;
let Auth = null;
let User = null;
let StateListeners = [];
const SESSION_ROOT_KEY = "meetings";
let Functions = null;



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
    Functions = getFunctions(App);
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
    if (User && Database) {
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
                inputName = "email"
                message = "wrong email and/or password";
                break;

            case "auth/user-not-found":
                inputName = "email"
                message = "email not found";
                break;

            case "auth/invalid-email":
                message = "wrong email";
                inputName = "email";
                break;

            case "auth/wrong-password":
                message = "wrong password";
                inputName = "password";
                break;

            case "auth/too-many-requests": 
                message = "To many attempts";
                inputName = "password"

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

export async function sendEmailVerification(){
    // Send email verification
    if (User) {
        const actionCodeSettings = {
            url: window.location.origin,
            handleCodeInApp: true
        };
        await _sendEmailVerification(User, actionCodeSettings);
    }
}

export async function signup(type, info) {
    switch (type) {
        case "email":
            let { email, password } = info;
            delete info.password;
            try {
                // Register user
                await createUserWithEmailAndPassword(Auth, email, password);

                // Set user info
                setUserInfo(info);

                await sendEmailVerification();
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


async function resetPassword(data) {
    let credentials = EmailAuthProvider.credential(User.email, data.oldpasscode)
    await reauthenticateWithCredential(User, credentials)
    await updatePassword(User, data.newpasscode)
}



/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SESSION FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Make session creates a new session signaling channel in the database
   returns the new session key */
export async function createSession(info) {
    
    const make = httpsCallable(Functions, 'createSession');
    let {data} = await make(info);

    return parseSession(data);
}

export async function deleteSession(sid) {
    const del = httpsCallable(Functions, 'deleteSession');
    await del({sid});
}

export async function editSession(info){
    const edit = httpsCallable(Functions, 'editSession');
    let {data} = await edit(info);
    console.log("edit", data);

    return parseSession(data);
}


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DATA ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
let DataListeners = []
let OldData = null
export function addDataListener(obj) {
    if (obj instanceof Function) {
        DataListeners.push(obj);
        if (OldData) {
            obj(parseData(OldData));
        }
    }
}


function updateDataListeners(sc) {
    OldData = sc;

    let value = parseData(sc);
    if (value.admin != null) {
        watchAdmin(value.admin);
    }

    for (let listener of DataListeners) {
        listener(parseData(sc))
    }
}

let FirebaseDataListeners = []
async function watchData() {
    stopWatch()
    if (Database && User != null) {
        let userInfoRef = getUserRef()
        await get(userInfoRef)
        onValue(userInfoRef, (value) => {
            updateDataListeners(value)
        })
    }
}
function stopWatch() {
    for (let listener of FirebaseDataListeners) {
        listener()
    }
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ADMIN ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
let AdminListeners = []
let OldAdmin = null
export function addAdminListener(obj) {
    if (obj instanceof Function) {
        AdminListeners.push(obj);
        if (OldAdmin) {
            obj(OldAdmin);
        }
    }
}


function updateAdminListeners(sc) {
    OldAdmin = sc
    for (let listener of AdminListeners) {
        listener(sc)
    }
}

let FirebaseAdminListeners = []
async function watchAdmin(name) {
    stopAdminWatch()
    if (Database && User != null) {
        let adminRef = ref(`companies/${name}`)
        onValue(adminRef, (value) => {
            updateAdminListeners(value.val())
        })
    }
}
function stopAdminWatch() {
    for (let listener of FirebaseAdminListeners) {
        listener()
    }
}

export async function updateAdminUsers(info){
    const update = httpsCallable(Functions, 'updateAdminUsers');
    let data = await update(info);
    console.log("update", data);

    return data
}


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DATA PARSER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

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
export function parseSession(session) {
    let ds = new Date(session.time);
    ds.setMinutes(ds.getMinutes() + ds.getTimezoneOffset());
    if ((new Date()).getTime() > ds.getTime() + session.duration * 60 * 1000) {
        session.status = "complete"
    }
    session.date = `${ds.getDate()}/${ds.getMonth()+1}/${ds.getFullYear()} ${ds.toLocaleTimeString("en", {timeStyle: "short"})}`
    session.link = `${window.location.origin}/Session/?${session.sid}`
    return session;
}
function round(x, y) {return Math.round(Math.pow(10, y) * x) / Math.pow(10, y)}
let LastInfo = null;
const DATA_PARSERS = [
    {
        name: "info",
        parse: (info) => {
            if (info == null) {
                info = {
                    firstName: "",
                    lastName: "",
                    displayName: User.displayName,
                    email: User.email,
                }
                setUserInfo(info);
            }
            if (!info.email)
                info.email = User.email

            if (!info.displayName || info.displayName == '')
                info.displayName = info.firstName + ' ' + info.lastName

            if (!info.displayPhoto) info.displayPhoto = User.photoURL

            if (!info.optionalData) info.optionalData = false;

            if (typeof info.displayPhoto != 'string')
                info.displayPhoto = "./images/defaultdp.svg"
            LastInfo = info;
            return info;
        },
    },
    {
        name: "sessions",
        parse: (sessions) => {
            let nSessions = [];
            if (typeof sessions == "object" && sessions != null) {
                for (let key in sessions) {
                    let session = sessions[key];
                    nSessions.push(parseSession(session));
                }
            }
            return nSessions;
        }
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
            if (data.sessions) {
                for (let s of data.sessions) {
                    total.hours += s.duration / 60;
                    total['sessions-count'] += 1;
                }
                total.hours = round(total.hours, 2);
            }

            let max = TIERS[licence.tier];
            let percent = {}
            for (let key in max) {
                percent[key] = max[key] == 0 ? 1 : round(total[key] / max[key], 2);
            }

            licence.max = max;
            licence.total = total;
            licence["%"] = percent;
            return licence;
        }
    },
    {
        name: "admin",
        parse: (value) => {

            return value;
        }
    }
]
export function parseData(sc) {
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




export async function sendSupportMessage(message, progress) {
    let r = push(ref("messages"))
    let key = r.key
    if (message.attachment instanceof File) {
        message.attachment = await uploadFileToCloud(message.attachment, `messages/${key}`, (uts) => {
            console.log(uts)
            if (progress instanceof Function)
                progress(uts.bytesTransferred / uts.totalBytes)
        })
    } else if ('attachment' in message) {
        delete message.attachment
    }
    console.log(message)
    await set(r, message)
}

async function updateDisplayPhoto(file, callback) {
    let url = await uploadFileToCloud(file, `users/${User.uid}/displayPhoto`)
    setUserInfo({ displayPhoto: url })
}

// Upload file to firebase storage bucket
async function uploadFileToCloud(file, path, statusCallback) {
    let Storage = getStorage(App, storageURL);

    // path = `${path}`
    console.log("uploading file of size", (file.size / 1e6) + "MB");

    if (!(file instanceof File) || typeof path !== 'string') {
        console.log('invalid file');
        return null;
    }

    if (!(statusCallback instanceof Function))
        statusCallback = () => { }

    let sr = sref(Storage, path);

    let uploadTask = uploadBytesResumable(sr, file);
    console.log(uploadTask);
    uploadTask.on('next', statusCallback)
    await uploadTask;

    let url = await getDownloadURL(sr);
    return url;
}

export function getUserInfo(){
    return LastInfo;
}

export { child, get, push, set, onChildAdded, onValue, resetPassword, updateDisplayPhoto }


