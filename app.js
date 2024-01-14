import {AppView} from "./templates/app-view.js"
import {LoginPage} from "./templates/login-page.js"

import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js'
import {getAuth, sendEmailVerification, createUserWithEmailAndPassword,signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js'
import {getDatabase, child, push, ref as _ref, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js'

const firebaseConfig = {
    apiKey: "AIzaSyDOhP-lTY1EC8XuHJUnxkWO5Tw8lolaV3s",
    authDomain: "login-with-firebase-data-5e14d.firebaseapp.com",
    projectId: "login-with-firebase-data-5e14d",
    storageBucket: "login-with-firebase-data-5e14d.appspot.com",
    messagingSenderId: "356416145411",
    appId: "1:356416145411:web:b0903c1e4ce0c40bc06636"
};

let loginPage = new LoginPage()
let appView = new AppView()

loginPage.addEventListener("signin", signin)

const App = initializeApp(firebaseConfig);
const Database = getDatabase(App);
const Auth = getAuth(App);

function ref(path) {return _ref(Database, path);}

// Sometimes user may already be authenticated before siging in to the app
let init = true;
onAuthStateChanged(Auth, async (user) => {
    console.log("auth state change: user data", user);
    if (init) {
        if (user == null) {
            document.body.appendChild(loginPage)
        }
        // User is already authenticated
        else if (user.emailVerified) {
            document.body.appendChild(appView)
            // CASE 1
            // User has had email verified 
            // and is successfuly authenticated 
        } else {
            alert("Email Verification Required")
            // CASE 2
            // User has still not verified their email
            // TODO: show some page to say user should check email
        }
        init = false;
    }
});

function setUserInfo(info){
    let user = Auth.currentUser
    if (user) {
        let infoRef = ref(user.uid + '/info')
        set(infoRef, info)
    }
}


async function register(element){
    let {email, password, first_name, last_name} = getForm(element);
    try {
        // Register user
        await createUserWithEmailAndPassword(Auth, email, password);
        let user = Auth.currentUser;

        // Set user info
        setUserInfo({first_name, last_name, email});

        // Send email verification
        const actionCodeSettings = {
            url: 'http://127.0.0.1:5500/?verified',
            handleCodeInApp: true
        };
        await sendEmailVerification(user, actionCodeSettings); 

        // CASE 2
        // User has still not verified their email
        // TODO: show some page to say user should check email
        alert("verification sent");

    } catch(error) {
        displayError(error, "register");
    }
}

async function signin(e) {

    let {email, password} = e.data;
    
    // TODO: Validate email and password by format

    try {
        await signInWithEmailAndPassword(Auth, email, password);
        let user = Auth.currentUser;
        if (user.emailVerified) {
            // CASE 1
            alert("You're In!")
            // User has had email verified 
            // and is successfuly authenticated 
        } else {
            // CASE 2
            alert("Email Verification Required")
            // User has still not verified their email
            // TODO: show some page to say user should check email
        }
    } catch (error) {
        displayError(error.code, "login");
    }
}

// Display the error message
function displayError(errorCode, type){
    let message = "";
    switch (errorCode) {
        case "auth/invalid-login-credentials":
            message = "wrong email and/or password";
            break;

        case "auth/invalid-email":
            message = "wrong email";
            break;

        case "auth/wrong-password":
            message = "wrong password";
            break;

        // TODO: Check other errors
        default:
            message = "error occured: " + errorCode;
            break;

    }

    // TODO: Change innerHTML of some element to display error message in widget
    switch (type) {
        case "login":
            break;

        case "register":
            break;
    }

    const errorMessage = document.getElementById("error-message")

    errorMessage.classList.add("error-shown");
    errorMessage.innerHTML = message;
}

// Get the all inputs in the parent of the given node and store their values in a json object 
function getForm(el) {
    let parent = el.parentNode;
    let form = {}
    for (let input of parent.querySelectorAll("input")) {
        // name attribute used as the key for the input value
        form[input.getAttribute("name")] = input.value;
    }
    return form;
}


/* TODO: Forgot password procedure
*/

window.register = register
window.login = login



