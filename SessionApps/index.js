import {LoginPage} from "../Console/templates/MainPages/login-page.js"
import * as F from '../Firebase/firebase-client.js'
import { MainPage } from "./main.js";
// import { updateUserDataComponents } from "../Utilities/CustomComponent.js"
// import { loadTemplates } from "../Utilities/template.js";
// import { MetricsView } from "./metrics.js";

// import * as M from "../Firebase/admin-metrics.js";

async function watch(uid, callback) {
    let data = {};
    const admin = await F.get(F.ref("super-admin/" + uid));
    data.admin = admin;
    F.onValue(F.ref("apps"), (snapshot) => {
        let apps = snapshot.val() || {};
        data.apps = Object.keys(apps).map(key => ({id: key, ...apps[key]}))
        callback(data);
    })
    return admin;
}

async function start() {
    let loginPage = new LoginPage();
    let appView = new MainPage();
    
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
        if (user && user.isAnonymous) {
            F.signOut();
            user = null;
        } 
    
    
        if (user) {
            F.updateMetrics(user.uid);
            if (user.emailVerified) {
                noUser = false;
                const admin = await watch(user.uid, (allData) => {
                    appView.admin = allData.admin;
                    appView.apps = allData.apps;
                })
                showScreen("appView");
                
            } else {
                // loginPage.mode = "sign-in";
                loginPage.email = user.email;
                loginPage.requestOTP(user.email);
                showScreen("loginPage")
            }
        } else {
            loginPage.mode = "sign-in";
            showScreen("loginPage")
            noUser = true;
        }
    });
    
    await F.initialise();
}

start();





