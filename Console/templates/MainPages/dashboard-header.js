import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { UserDataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { RouteQuery } from "../../../Utilities/router.js";

useCSSStyle("theme");
useCSSStyle("dashboard-welcome");

class DashboardHeader extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("dashboard-header");
        this.setupEventListeners();
        
        // Handle hash changes to update active state
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            this.updateActiveItem(hash);
        });
        
        // Handle initial hash
        const initialHash = window.location.hash.slice(1) || 'dashboard';
        this.updateActiveItem(initialHash);
    }

    setupEventListeners() {
        // Navigation items - use event delegation
        this.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const route = navItem.dataset.route;
                if (route) {
                    window.location.hash = route;
                }
            }
        });
    }

    updateActiveItem(route) {
        // Parse route query params
        const query = RouteQuery.parse(route, 'dashboard');
        const routeName = query.location;
        
        const navItems = this.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.route === routeName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // If route is 'profile', we don't have a nav item, but we can highlight nothing or handle if needed
        // Currently profile is accessed via avatar click
    }
}

SvgPlus.defineHTMLElement(DashboardHeader);
export { DashboardHeader };
