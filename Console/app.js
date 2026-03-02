import {AppView} from "./templates/app-view.js"
import {LoginPage} from "./templates/MainPages/login-page.js"

import * as F from '../Firebase/firebase-client.js'
import { updateUserDataComponents } from "../Utilities/CustomComponent.js"
import { watch } from "../Firebase/main.js";
import { loadTemplates } from "../Utilities/template.js";


async function start() {
    await loadTemplates();
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
    let endWatchers = () => {};
    F.addAuthChangeListener(async (user) => {
        if (user && user.isAnonymous) {
            console.log("Signing out anonymous user");
            F.signOut();
            user = null;
        } 

        endWatchers();
        endWatchers = () => {};
    
        if (user) {
            F.updateMetrics(user.uid);
            if (user.emailVerified) {
                // Start watching user data and update
                // the app view when it changes
                console.log("Watching user data for user:", user.uid);
                endWatchers = await watch(user?.uid, (allData, type) => {
                    updateUserDataComponents(allData);
                });
                showScreen("appView");
            } else {
                console.log("User requires email verification:", user.uid);

                // If the user's email is not verified, 
                // show the login page and prompt them to verify their email
                loginPage.onEmailNeedsVerification(user);
                showScreen("loginPage")
            }
        } else {
            console.log("No user signed in");
            // If there is no user, show the login page
            loginPage.mode = "sign-in";
            showScreen("loginPage")
        }
        
    });
    
    
    await F.initialise();
}

start();





