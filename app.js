import {AppView} from "./templates/app-view.js"
import {LoginPage} from "./templates/login-page.js"

import * as F from './Firebase/firebase-client.js'
import { updateUserDataComponents } from "./CustomComponent.js"
import { watch } from "./Firebase/New/main.js";



let loginPage = new LoginPage();
let appView = new AppView();


let Type = null;
function showScreen(type) {
    if (Type == null) {
        setTimeout(() => {
            document.querySelector("squidly-loader[full]").hide(0.5);
        },500);
    }
    if (type !== Type) {
        Type = type;
        let pages = {loginPage, appView};
        for (let key in pages) pages[key].remove();
        document.body.appendChild(pages[type]);
    }
}

// Sometimes user may already be authenticated before siging in to the app
let noUser = true;
F.addAuthChangeListener(async (user) => {
    if (user) {
        watch(user?.uid, (allData, type) => {
            
            updateUserDataComponents(allData);
            showScreen("appView");
        });
    }

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

// F.addDataListener( (value) => {
//     // console.log(value);
//     noUser = false;
//     showScreen("appView")
// })

await F.initialise();



