import { firebaseConfig } from "./firebase-config.js"
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import { signOut, getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential, updatePassword, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
import { getDatabase, child, push, ref as _ref, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js'

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
        if (User != null) updateUserData();
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


async function updateUserData() {
    if (await getUserData("info") == null) {
        console.log(User);
        // await setUserInfo({
        //     displayName: User.displayName,
        // })
    }
}
async function getUserData(path) {
    let userData = null;
    if (User) {
        path = typeof path === "string" ? "/" + path : "";
        let infoRef = ref('users/' + User.uid + path);
        let sc = await get(infoRef);
        userData = sc.val();
    }
    return userData;
}
async function setUserInfo(info) {
    if (User) {
        let infoRef = ref('users/' + User.uid + '/info');
        await set(infoRef, info);
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

export function signout(){signOut(Auth)}

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
  export async function makeSessionKey(){
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
    let credentials = EmailAuthProvider.credential(User.email,data.oldpasscode)
    await reauthenticateWithCredential(User,credentials)
    await updatePassword(User,data.newpasscode)
  }

export { child, get, push, set, onChildAdded, onValue, resetPassword }
