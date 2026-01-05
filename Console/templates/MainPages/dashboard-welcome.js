import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { UserDataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { RouteQuery } from "../../../Utilities/router.js";

useCSSStyle("theme");
useCSSStyle("dashboard-welcome");

class DashboardWelcome extends UserDataComponent {
    constructor(el) {
        // When used as custom element via SvgPlus.defineHTMLElement, el is the element itself
        // When manually created, el might be undefined - create a div in that case
        if (!el) {
            el = document.createElement('div');
        }
        super(el);
    }

    onconnect() {
        this.template = getHTMLTemplate("dashboard-welcome");
        this.setupEventListeners();
        
        // Simple check: Dashboard window has 'dashboard-window' class on body
        this.isDashboardWindow = document.body.classList.contains('dashboard-window');
        
        // Only set active and handle navigation if in Dashboard window
        if (this.isDashboardWindow) {
            // Set active by default (dashboard is the default page)
            this.active = true;
            
            // Handle hash changes
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.slice(1) || 'dashboard';
                this.handleNavigation(hash);
            });
            
            // Handle initial hash
            const initialHash = window.location.hash.slice(1) || 'dashboard';
            if (initialHash !== 'dashboard') {
                this.handleNavigation(initialHash);
            }
        }
    }
    
    // Removed handleDirectNavigation, waitForAppView, setupGlobalClickHandler - using simple handleNavigation instead
    

    setupEventListeners() {
        // Navigation items - use event delegation
        this.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const route = navItem.dataset.route;
                if (route) {
                    this.handleNavigation(route);
                }
            }
        });

        // Action cards - use event delegation
        this.addEventListener('click', (e) => {
            const actionCard = e.target.closest('.action-card');
            if (actionCard) {
                const action = actionCard.dataset.action;
                if (action) {
                    this.handleAction(action);
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
        // Only handle navigation in Dashboard window
        if (!this.isDashboardWindow) {
            // In Console window, let app-view handle it
            if (window.appView) {
                window.appView.panel = route;
            }
            return;
        }
        
        // Update active nav item
        const navItems = this.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.route === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Simple page switching - same logic as Console app-view.js
        // Get all Dashboard pages (direct children of body)
        const dashboardPages = Array.from(document.body.children).filter(
            el => el.tagName.toLowerCase() === 'dashboard-welcome' || 
                  el.tagName.toLowerCase() === 'calendar-page'
        );
        
        let foundMatch = false;
        
        // First, try to find existing page
        for (let page of dashboardPages) {
            const tagName = page.tagName.toLowerCase();
            const nameAttr = page.getAttribute("name");
            const matches = tagName === route || nameAttr === route ||
                          (route === 'dashboard' && tagName === 'dashboard-welcome') ||
                          (route === 'dashboard-welcome' && tagName === 'dashboard-welcome');
            
            if (matches) {
                foundMatch = true;
                page.active = true;
            } else {
                page.active = false;
            }
        }
        
        // If no match found, create calendar-page if needed
        if (!foundMatch && route === 'calendar') {
            const calendarPage = document.createElement('calendar-page');
            calendarPage.setAttribute('name', 'calendar');
            document.body.appendChild(calendarPage);
            
            // Wait for component to initialize (onconnect will be called automatically)
            // Then set active after a short delay to ensure template is loaded
            setTimeout(() => {
                calendarPage.active = true;
            }, 100);
            foundMatch = true;
        }
        
        // Set URL hash
        if (route !== 'dashboard' && route !== 'dashboard-welcome') {
            window.location.hash = `#${route}`;
        }
    }

    handleAction(action) {
        switch (action) {
            case 'console':
                // Open console window
                if (window.api && typeof window.api.openConsole === 'function') {
                    try {
                        window.api.openConsole();
                    } catch (error) {
                        alert('Error opening Console window: ' + error.message);
                    }
                } else {
                    // Wait for API to be ready (with timeout)
                    let attempts = 0;
                    const maxAttempts = 50; // 5 seconds max
                    const checkApi = () => {
                        attempts++;
                        if (window.api && typeof window.api.openConsole === 'function') {
                            try {
                                window.api.openConsole();
                            } catch (error) {
                                alert('Error opening Console window: ' + error.message);
                            }
                        } else if (attempts < maxAttempts) {
                            setTimeout(checkApi, 100);
                        } else {
                            alert('Error opening Console window: API initialization timeout.');
                        }
                    };
                    setTimeout(checkApi, 100);
                }
                break;
            case 'host':
                // Create a new meeting/session
                if (window.appView && window.appView.createSession) {
                    window.appView.createSession();
                } else {
                    // Fallback: navigate to meetings panel
                    this.handleNavigation('calendar');
                }
                break;
            case 'join':
                // Show join meeting dialog or navigate
                if (window.appView && window.appView.showJoinDialog) {
                    window.appView.showJoinDialog();
                } else {
                    this.handleNavigation('calendar');
                }
                break;
            case 'schedule':
                // Navigate to schedule/meetings
                this.handleNavigation('calendar');
                break;
        }
    }

    onvalue(value) {
        // Update today's meetings if available
        if (value.meetings && Array.isArray(value.meetings)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayMeetings = value.meetings.filter(meeting => {
                const meetingDate = new Date(meeting.date || meeting.time);
                meetingDate.setHours(0, 0, 0, 0);
                return meetingDate.getTime() === today.getTime();
            });

            const meetingsContainer = this.querySelector('[name="todayMeetings"]');
            if (meetingsContainer && todayMeetings.length > 0) {
                meetingsContainer.innerHTML = todayMeetings.map(meeting => {
                    const time = this.formatMeetingTime(meeting.time || meeting.date);
                    const duration = meeting.duration || '30 mins';
                    const description = meeting.description || 'Meeting';
                    
                    return `
                        <div class="meeting-card">
                            <div class="meeting-info">
                                <h3>${description}</h3>
                                <div class="meeting-meta">
                                    <svg width="14" height="14" viewBox="0 0 24 24" class="icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span>${duration}</span>
                                </div>
                            </div>
                            <div class="meeting-time">${time}</div>
                        </div>
                    `;
                }).join('');
            } else if (meetingsContainer && todayMeetings.length === 0) {
                meetingsContainer.innerHTML = `
                    <div class="meeting-card">
                        <div class="meeting-info">
                            <h3>No meetings scheduled for today</h3>
                            <div class="meeting-meta">
                                <span>Schedule a meeting to get started</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    formatMeetingTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${displayHours}:${displayMinutes}${ampm}`;
    }
}

// Register as custom element using SvgPlus.defineHTMLElement (same as other components)
SvgPlus.defineHTMLElement(DashboardWelcome);

export { DashboardWelcome };
