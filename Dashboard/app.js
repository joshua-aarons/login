import { DashboardWelcome } from "../Console/templates/MainPages/dashboard-welcome.js";
import * as F from '../Firebase/firebase-client.js'
import { updateUserDataComponents } from "../Utilities/CustomComponent.js";
import { watch } from "../Firebase/main.js";
import { loadTemplates } from "../Utilities/template.js";

async function start() {
    await loadTemplates();
    
    const dashboardWelcome = document.createElement('dashboard-welcome');
    document.body.appendChild(dashboardWelcome);
    
    F.addAuthChangeListener(async (user) => {
        if (user && user.emailVerified) {
            await watch(user?.uid, (allData, type) => {
                updateUserDataComponents(allData);
            });
        } else {
            if (window.api?.notifyShowLogin) {
                window.api.notifyShowLogin();
            }
        }
    });
    
    await F.initialise();
}

start();
