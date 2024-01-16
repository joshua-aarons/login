import {AppView} from "./templates/app-view.js"
import {LoginPage} from "./templates/login-page.js"
import {addListener} from "./dummy-data.js"

import * as F from './Firebase/firebase.js'



let loginPage = new LoginPage()
let appView = new AppView()
function showScreen(type) {
    let pages = {loginPage, appView};
    for (let key in pages) pages[key].remove();
    document.body.appendChild(pages[type]);
}

loginPage.addEventListener("signin", async (e) => {
    try {
        await F.signin("email", e.data);
    } catch (e) {
        loginPage.signinError = e;
    }
});

loginPage.addEventListener("signup", async (e) => {
    try {
        await F.signup("email", e.data);
    } catch (err) {
        loginPage.signupError = err;
    }
})


// Sometimes user may already be authenticated before siging in to the app
F.addAuthChangeListener(async (user) => {
    console.log(user);
    if (user == null) {
        showScreen("loginPage")
    } else if (user.emailVerified) {
        showScreen("appView")
    } else {

    }
});
window.F = F;

console.log("here");
await F.initialise();
console.log("here2");



