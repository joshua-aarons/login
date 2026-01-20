import { DashboardWelcome } from "../Console/templates/MainPages/dashboard-welcome.js";
import {} from "../Console/templates/MainPages/dashboard-header.js"; // Import to register dashboard-header component
import {} from "../Console/templates/MainPages/calendar-page.js"; // Import to register calendar-page component
import {} from "../Console/templates/MainPages/settings-panel.js"; // Import to register settings-panel component
import {} from "../Console/templates/MainPages/profile-panel.js"; // Import to register profile-panel component
import {} from "../Console/templates/MeetingTools/meeting-display.js"; // Import to register meeting-display component
import {} from "../Console/templates/MeetingTools/meeting-scheduler.js"; // Import to register meeting-scheduler component
import * as F from '../Firebase/firebase-client.js'
import { updateUserDataComponents } from "../Utilities/CustomComponent.js";
import { watch } from "../Firebase/main.js";
import { loadTemplates } from "../Utilities/template.js";

// Store current user data so we can update newly created components
let currentUserData = null;

async function start() {
    // Start loading templates immediately
    const templatesPromise = loadTemplates();
    
    // Setup auth listener and start Firebase initialization in parallel
    let stopWatch = null;
    
    F.addAuthChangeListener(async (user) => {
        // Stop previous watch if exists
        if (stopWatch) {
            stopWatch();
            stopWatch = null;
        }
        
        if (user && user.emailVerified) {
            stopWatch = await watch(user?.uid, (allData, type) => {
                currentUserData = allData;
                updateUserDataComponents(allData);
            });
        } else {
            currentUserData = null;
            if (window.api?.notifyShowLogin) {
                window.api.notifyShowLogin();
            }
        }
    });
    
    const firebaseInitPromise = F.initialise();

    // Wait for templates to be ready before creating UI components
    await templatesPromise;
    
    // Mark this as Dashboard window (not Console window)
    document.body.classList.add('dashboard-window');
    
    // notifications-list is already in HTML (same as Console)
    // Just ensure it exists
    let notificationsList = document.querySelector('notifications-list');
    if (!notificationsList) {
        notificationsList = document.createElement('notifications-list');
        document.body.appendChild(notificationsList);
    }
    
    const dashboardHeader = document.createElement('dashboard-header');
    document.body.appendChild(dashboardHeader);

    const dashboardWelcome = document.createElement('dashboard-welcome');
    document.body.appendChild(dashboardWelcome);
    
    // Ensure Firebase initialization is complete
    await firebaseInitPromise;
}

// Export function to update newly created components with current data
window.updateNewComponentWithUserData = function() {
    // Update all components (including newly created ones) with current data
    if (currentUserData) {
        updateUserDataComponents(currentUserData);
    }
};

start();
