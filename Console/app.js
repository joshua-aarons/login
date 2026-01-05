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
                // Remove loader if it exists (now loader is in separate logo window)
                const loader = document.querySelector("squidly-loader[full]");
                if (loader) {
                    loader.hide(0.5);
                }
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
        if (user && user.isAnonymous) {
            F.signOut();
            user = null;
        } 
    
    
        if (user) {
            F.updateMetrics(user.uid);
            if (user.emailVerified) {
                noUser = false;
                 await watch(user?.uid, (allData, type) => {
                    updateUserDataComponents(allData);
                });
                showScreen("appView");
                // Notify Electron to adjust window for app mode
                if (window.api?.notifyLoginSuccess) {
                    window.api.notifyLoginSuccess();
                }
            } else {
                // loginPage.mode = "sign-in";
                loginPage.email = user.email;
                loginPage.requestOTP(user.email);
                showScreen("loginPage")
                // Notify Electron to adjust window for login mode
                if (window.api?.notifyShowLogin) {
                    window.api.notifyShowLogin();
                }
            }
        } else {
            loginPage.mode = "sign-in";
            showScreen("loginPage")
            noUser = true;
            // Notify Electron to adjust window for login mode
            if (window.api?.notifyShowLogin) {
                window.api.notifyShowLogin();
            }
        }
        
    });
    
    
    await F.initialise();
}

start();





