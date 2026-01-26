import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { UserDataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { RouteQuery } from "../../../Utilities/router.js";
import { createSession } from "../../../Firebase/sessions.js";

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
        // Action cards - use event delegation
        this.addEventListener('click', (e) => {
            const actionCard = e.target.closest('.action-card');
            if (actionCard) {
                const action = actionCard.dataset.action;
                if (action) {
                    this.handleAction(action);
                }
            }

            // Meeting cards
            const meetingCard = e.target.closest('.meeting-card');
            if (meetingCard && meetingCard.dataset.sid) {
                const sid = meetingCard.dataset.sid;
                if (this.value.meetings && Array.isArray(this.value.meetings)) {
                    const meeting = this.value.meetings.find(m => m.sid === sid);
                    if (meeting) {
                        this.displayMeeting(meeting);
                    }
                }
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
        

        // Parse route query params
        const query = RouteQuery.parse(route, 'dashboard');
        const routeName = query.location;
        const routeParams = query.params;
        
        // Simple page switching - same logic as Console app-view.js
        // Get all Dashboard pages (direct children of body)
        const dashboardPages = Array.from(document.body.children).filter(
            el => el.tagName.toLowerCase() === 'dashboard-welcome' || 
                  el.tagName.toLowerCase() === 'calendar-page' ||
                  el.tagName.toLowerCase() === 'settings-panel' ||
                  el.tagName.toLowerCase() === 'profile-panel' ||
                  el.tagName.toLowerCase() === 'meeting-display'
        );
        
        let foundMatch = false;
        
        // First, try to find existing page
        for (let page of dashboardPages) {
            const tagName = page.tagName.toLowerCase();
            const nameAttr = page.getAttribute("name");
            const matches = tagName === routeName || nameAttr === routeName ||
                          (routeName === 'dashboard' && tagName === 'dashboard-welcome') ||
                          (routeName === 'dashboard-welcome' && tagName === 'dashboard-welcome') ||
                          (routeName === 'settings' && tagName === 'settings-panel') ||
                          (routeName === 'profile' && tagName === 'profile-panel');
            
            if (matches) {
                foundMatch = true;
                page.active = true;
                // Set params if component supports it
                if (typeof page.setParams === 'function') {
                    page.setParams(routeParams);
                } else if (page.params !== undefined) {
                    page.params = routeParams;
                }
            } else {
                page.active = false;
            }
        }
        
        // Handle meeting-display separately (it's in a popup, not a page)
        // This is handled by displayMeeting method instead (like Console)
        if (routeName === 'meeting-display') {
            // Close popup if navigating away
            const popup = document.querySelector('[name="meetingDisplayPopup"]');
            if (popup) {
                popup.classList.remove('open');
            }
        }
        
        // If no match found, create page if needed
        if (!foundMatch) {
            let newPage = null;
            if (routeName === 'calendar') {
                newPage = document.createElement('calendar-page');
                newPage.setAttribute('name', 'calendar');
            } else if (routeName === 'settings') {
                newPage = document.createElement('settings-panel');
                newPage.setAttribute('name', 'settings');
            } else if (routeName === 'profile') {
                newPage = document.createElement('profile-panel');
                newPage.setAttribute('name', 'profile');
            }
            
            if (newPage) {
                // For meeting-display, we don't append to body directly (it's in popup)
                if (routeName !== 'meeting-display') {
                document.body.appendChild(newPage);
                }
                console.log('[DashboardWelcome] Page created:', newPage.tagName);
                // Set params before setting active
                if (routeParams && Object.keys(routeParams).length > 0) {
                    console.log('[DashboardWelcome] Setting params:', routeParams);
                    if (typeof newPage.setParams === 'function') {
                        newPage.setParams(routeParams);
                    } else if (newPage.params !== undefined) {
                        newPage.params = routeParams;
                    } else {
                        console.warn('[DashboardWelcome] Component does not support params:', newPage.tagName);
                    }
                }
                // Wait for component to initialize (onconnect will be called automatically)
                // Then set active after a short delay to ensure template is loaded
                setTimeout(() => {
                    newPage.active = true;
                    // Update all components (including newly created one) with current user data
                    if (window.updateNewComponentWithUserData) {
                        window.updateNewComponentWithUserData();
                    }
                }, 150);
                foundMatch = true;
            } else {
                console.warn('[DashboardWelcome] No page created for route:', routeName);
            }
        }
        
        // Set URL hash
        if (routeName !== 'dashboard' && routeName !== 'dashboard-welcome') {
            const routeQuery = new RouteQuery(routeName, routeParams);
            const newHash = routeQuery.toString();
            const currentHash = window.location.hash.slice(1);
            
            // Only update hash if it's different
            if (currentHash !== newHash) {
                window.location.hash = newHash;
            }
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
                // Host a new meeting (reuse Console's hostMeeting logic)
                this.hostMeeting();
                break;

            case 'schedule':
                // Schedule a meeting (reuse Console's scheduleMeeting logic)
                this.scheduleMeeting();
                break;
        }
    }

    /**
     * Host a new meeting (reuse Console's hostMeeting logic)
     */
    async hostMeeting() {
        try {
            let session = await createSession("empty");
            window.open(window.location.origin + `/V3/?${session.sid}`);
        } catch (e) {
            console.warn("Failed to create session: ", e);
            if (window.showNotification) {
                window.showNotification("You will need a licence to host meetings.", 5000, "error");
            }
        }
    }

    /**
     * Schedule a meeting (reuse Console's scheduleMeeting logic)
     */
    scheduleMeeting(meeting) {
        const schedulerPopup = this.querySelector('[name="meetingSchedulerPopup"]');
        const scheduler = this.querySelector('[name="meetingScheduler"]');
        
        if (schedulerPopup && scheduler) {
            if (meeting) {
                scheduler.value = meeting;
            }
            schedulerPopup.classList.add('open');
        } else {
            console.warn('[DashboardWelcome] Meeting scheduler popup or component not found');
        }
    }

    /**
     * Display meeting in popup (same as Console's app-view.displayMeeting)
     * @param {Object} meeting - The meeting/session object
     */
    displayMeeting(meeting) {
        // Ensure popup exists (like Console)
        let popup = document.querySelector('[name="meetingDisplayPopup"]');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'popup';
            popup.setAttribute('name', 'meetingDisplayPopup');
            document.body.appendChild(popup);
        }
        
        // Ensure meeting-display component exists
        let meetingDisplay = popup.querySelector('meeting-display[name="meetingDisplay"]');
        if (!meetingDisplay) {
            meetingDisplay = document.createElement('meeting-display');
            meetingDisplay.setAttribute('name', 'meetingDisplay');
            popup.appendChild(meetingDisplay);
        }
        
        // Set meeting value directly (same as Console)
        // Ensure meeting object has delete method by converting it if possible
        if (typeof meetingDisplay.convertMeetingToSession === 'function') {
            meetingDisplay.value = meetingDisplay.convertMeetingToSession(meeting);
        } else {
            meetingDisplay.value = meeting;
        }
        
        // Open popup
        popup.classList.add('open');
        
        // Add click handler to close popup when clicking outside (like Console)
        const handlePopupClick = (e) => {
            if (e.target === popup) {
                this.closeMeetingDisplay();
                popup.removeEventListener('click', handlePopupClick);
            }
        };
        // Remove old listener if exists
        popup.removeEventListener('click', handlePopupClick);
        popup.addEventListener('click', handlePopupClick);
    }
    
    /**
     * Close meeting display popup
     */
    closeMeetingDisplay() {
        const popup = document.querySelector('[name="meetingDisplayPopup"]');
        if (popup) {
            popup.classList.remove('open');
        }
    }

    onvalue(value) {
        // Update today's meetings if available
        if (value.meetings && Array.isArray(value.meetings)) {
            const now = new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayMeetings = value.meetings
                .filter(meeting => {
                    const meetingDate = new Date(meeting.date || meeting.time);
                    const isToday = meetingDate.getDate() === today.getDate() && 
                                  meetingDate.getMonth() === today.getMonth() && 
                                  meetingDate.getFullYear() === today.getFullYear();
                    // Keep if today AND start time is in future (or very recent past if desired, but user asked for upcoming)
                    // Strict upcoming: meetingDate > now
                    return isToday && meetingDate > now;
                })
                .sort((a, b) => {
                    // Sort by time ascending (nearest first)
                    return new Date(a.date || a.time) - new Date(b.date || b.time);
                });

            const meetingsContainer = this.querySelector('[name="todayMeetings"]');
            if (meetingsContainer && todayMeetings.length > 0) {
                meetingsContainer.innerHTML = todayMeetings.map(meeting => {
                    const time = this.formatMeetingTime(meeting.time || meeting.date);
                    const description = meeting.description || 'Meeting';
                    
                    // Calculate remaining time
                    const meetingTime = new Date(meeting.time || meeting.date);
                    const diffMs = meetingTime - now;
                    const diffMins = Math.floor(diffMs / 60000);
                    
                    let timeRemaining;
                    if (diffMins < 1) {
                        timeRemaining = 'Starting now';
                    } else if (diffMins < 60) {
                        timeRemaining = `in ${diffMins} mins`;
                    } else {
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        if (mins === 0) {
                            timeRemaining = `in ${hours} hr${hours > 1 ? 's' : ''}`;
                        } else {
                            timeRemaining = `in ${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`;
                        }
                    }
                    
                    return `
                        <div class="meeting-card" data-sid="${meeting.sid}">
                            <div class="meeting-info">
                                <h3>${description}</h3>
                                <div class="meeting-meta">
                                    <svg width="14" height="14" viewBox="0 0 24 24" class="icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span>${timeRemaining}</span>
                                </div>
                            </div>
                            <div class="meeting-time">${time}</div>
                        </div>
                    `;
                }).join('');
            } else if (meetingsContainer && todayMeetings.length === 0) {
                // Check if there were meetings today that are already passed
                const hasMeetingsToday = value.meetings.some(meeting => {
                    const meetingDate = new Date(meeting.date || meeting.time);
                    return meetingDate.getDate() === today.getDate() && 
                           meetingDate.getMonth() === today.getMonth() && 
                           meetingDate.getFullYear() === today.getFullYear();
                });

                meetingsContainer.innerHTML = `
                    <div class="meeting-card" style="cursor: default;">
                        <div class="meeting-info">
                            <h3>${hasMeetingsToday ? 'No more meetings today' : 'No meetings scheduled for today'}</h3>
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
