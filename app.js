import {AppView} from "./templates/app-view.js"
import {LoginPage} from "./templates/login-page.js"
import {addListener} from "./dummy-data.js"

import * as F from './Firebase/firebase.js'
import { updateUserDataComponents } from "./CustomComponent.js"



let loginPage = new LoginPage();
let appView = new AppView();


let Type = null;
function showScreen(type) {
    if (Type == null) {
        let splash = document.querySelector("splash-screen");
        splash.toggleAttribute("fade", true);
        setTimeout(() => splash.remove(), 300);
    }
    if (type !== Type) {
        Type = type;
        let pages = {loginPage, appView};
        for (let key in pages) pages[key].remove();
        document.body.appendChild(pages[type]);
    }
}

// loginPage.addEventListener("signin", async (e) => {
//     try {
//         await F.signin("email", e.data);
//     } catch (e) {
//         loginPage.signinError = e;
//     }
// });

// loginPage.addEventListener("signup", async (e) => {
//     try {
//         await F.signup("email", e.data);
//     } catch (err) {
//         loginPage.signupError = err;
//     }
// })


// Sometimes user may already be authenticated before siging in to the app
let noUser = true;
F.addAuthChangeListener(async (user) => {
    if (user == null) {
        showScreen("loginPage")
        noUser = true;
    } else if (!user.emailVerified) {
        console.log("HERE");
        showScreen("loginPage")
        loginPage.emailVerify = true;
        noUser = true;
    } else {
    }
});

F.addDataListener( (value) => {
    updateUserDataComponents(value);
    if (noUser) appView.panel = "dash-board";
    noUser = false;
    showScreen("appView")
})

window.F = F;




// console.log("here");
await F.initialise();
// console.log("here2");



