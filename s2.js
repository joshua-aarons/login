import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js'
import {getAuth, sendEmailVerification, createUserWithEmailAndPassword,signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js'
import {getDatabase, child, push, ref as _ref, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js'

const firebaseConfig = {
    apiKey: "AIzaSyChiEAP1Rp1BDNFn7BQ8d0oGR65N3rXQkE",
    authDomain: "eyesee-d0a42.firebaseapp.com",
    databaseURL: "https://eyesee-d0a42-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "eyesee-d0a42",
    storageBucket: "eyesee-d0a42.appspot.com",
    messagingSenderId: "56834287411",
    appId: "1:56834287411:web:999340ed2fd5165fa68046"
};

const App = initializeApp(firebaseConfig);
const Database = getDatabase(App);
const Auth = getAuth(App);

function ref(path) {return ref(Database, path);}

const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');


registerBtn.addEventListener('click', () => container.classList.add("active"));
loginBtn.addEventListener('click', () => container.classList.remove("active"));


// Sometimes user may already be authenticated before siging in to the app
let init = true;
onAuthStateChanged(Auth, async (user) => {
    console.log("auth state change: user data", user);
    if (init) {
        // User is already authenticated
        if (user.emailVerified) {
            // CASE 1
            // User has had email verified 
            // and is successfuly authenticated 
        } else {
            // CASE 2
            // User has still not verified their email
            // TODO: show some page to say user should check email
        }
        init = false;
    }
});


async function register(element){
    let {email, password, first_name, last_name} = getForm(element);
    try {
        // Register user
        await createUserWithEmailAndPassword(Auth, email, password);
        let user = Auth.currentUser;

        // TODO: set users first and last name in database

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

async function login(element) {

    let {email, password} = getForm(element);
    
    // TODO: Validate email and password by format

    try {
        await signInWithEmailAndPassword(Auth, email, password);
        let user = Auth.currentUser;
        if (user.emailVerified) {
            // CASE 1
            // User has had email verified 
            // and is successfuly authenticated 
        } else {
            // CASE 2
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
        case "auth/invalid-email":
            message = "wrong email";
            break;

        case "auth/wrong-password":
            message = "wrong password";
            break;

        // TODO: Check other errors
        default:
            message = "error occured: " + error.code;
            break;

    }

    // TODO: Change innerHTML of some element to display error message in widget
    switch (type) {
        case "login":
            break;

        case "register":
            break;
    }
    alert(message);
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


