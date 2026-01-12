import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import {} from "./Profiles/client-profiles.js"
useCSSStyle("theme");

class SettingsPanel extends UserDataComponent {
    onconnect(){
        this.template = getHTMLTemplate("settings-panel");
        let keys = ['hostVideo', 'participantVideo', 'hostAudio', 'participantAudio']
        for (let key of keys) {
            let input = this.els["info/"+key];
            input.addEventListener("input", () => {
                this.updateUserData({[key]: input.checked})
            })
          }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Navigation items
        this.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const route = navItem.dataset.route;
                if (route) {
                    this.handleNavigation(route);
                }
            }
        });

        // User avatar click
        this.addEventListener('click', (e) => {
            const userAvatar = e.target.closest('.user-avatar');
            if (userAvatar) {
                this.handleNavigation('profile');
            }
        });
    }

    handleNavigation(route) {
        // Check if we're in Dashboard window (not inside app-view)
        const isDashboardWindow = document.body.classList.contains('dashboard-window');
        
        if (isDashboardWindow) {
            // In Dashboard window, find dashboard-welcome and call its handleNavigation
            const dashboardWelcome = document.querySelector('dashboard-welcome');
            if (dashboardWelcome && typeof dashboardWelcome.handleNavigation === 'function') {
                dashboardWelcome.handleNavigation(route);
            }
        } else {
            // In Console window, use app-view
            if (window.appView) {
                window.appView.panel = route === 'dashboard' ? 'dashboard-welcome' : route;
            }
        }
        
        // Update active nav item in settings-panel
        const navItems = this.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.route === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

SvgPlus.defineHTMLElement(SettingsPanel);