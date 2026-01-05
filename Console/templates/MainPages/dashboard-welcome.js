import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { UserDataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";

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
        // Use event delegation to ensure clicks work even if component initialization has issues
        this.setupEventListeners();
        
        // Also set up a global click handler as fallback
        this.setupGlobalClickHandler();
        
        // Test API availability on connect
        setTimeout(() => {
            console.log('=== Testing API availability ===');
            console.log('window.api:', window.api);
            console.log('window.api.openConsole:', window.api && window.api.openConsole);
            console.log('window.api.openConsole type:', typeof (window.api && window.api.openConsole));
            if (window.api) {
                console.log('Available API methods:', Object.keys(window.api));
            }
        }, 500);
    }


    setupGlobalClickHandler() {
        // Use event delegation on the component itself
        this.addEventListener('click', (e) => {
            const target = e.target.closest('.action-card');
            if (target) {
                const action = target.dataset.action;
                if (action) {
                    console.log('Global click handler: Action card clicked:', action);
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleAction(action);
                    return;
                }
            }
            
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const route = navItem.dataset.route;
                if (route) {
                    console.log('Global click handler: Nav item clicked:', route);
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleNavigation(route);
                    return;
                }
            }
            
            const userAvatar = e.target.closest('.user-avatar');
            if (userAvatar) {
                console.log('Global click handler: User avatar clicked');
                e.preventDefault();
                e.stopPropagation();
                this.handleNavigation('profile');
            }
        }, true); // Use capture phase to catch events early
    }

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
                    console.log('Event delegation: Action card clicked:', action);
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
        console.log('Navigate to:', route);
        
        // Update active nav item
        const navItems = this.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.route === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Handle different routes
        switch (route) {
            case 'dashboard':
                // Already on dashboard
                break;
            case 'calendar':
                // Navigate to meetings panel
                if (window.appView) {
                    window.appView.showPanel('meetings');
                }
                break;
            case 'settings':
                // Navigate to settings panel
                if (window.appView) {
                    window.appView.showPanel('settings');
                }
                break;
            case 'profile':
                // Navigate to profile panel
                if (window.appView) {
                    window.appView.showPanel('profile');
                }
                break;
        }
    }

    handleAction(action) {
        console.log('Action triggered:', action);
        console.log('window.api:', window.api);
        console.log('window.api type:', typeof window.api);
        
        switch (action) {
            case 'console':
                // Open console window
                console.log('=== Console button clicked ===');
                console.log('window.api exists:', !!window.api);
                console.log('window.api.openConsole exists:', !!(window.api && window.api.openConsole));
                console.log('window.api.openConsole type:', typeof (window.api && window.api.openConsole));
                
                // Direct call attempt
                if (window.api && typeof window.api.openConsole === 'function') {
                    console.log('Calling window.api.openConsole() directly...');
                    try {
                        window.api.openConsole();
                        console.log('✓ openConsole called successfully');
                    } catch (error) {
                        console.error('✗ Error calling openConsole:', error);
                        console.error('Error stack:', error.stack);
                        alert('无法打开 Console 窗口: ' + error.message);
                    }
                } else {
                    console.warn('window.api.openConsole not available, waiting...');
                    console.log('window.api keys:', window.api ? Object.keys(window.api) : 'window.api is null/undefined');
                    
                    // Wait for API to be ready (with timeout)
                    let attempts = 0;
                    const maxAttempts = 50; // 5 seconds max
                    const checkApi = () => {
                        attempts++;
                        console.log(`[Attempt ${attempts}/${maxAttempts}] Checking API...`);
                        console.log('window.api:', window.api);
                        console.log('window.api.openConsole:', window.api && window.api.openConsole);
                        
                        if (window.api && typeof window.api.openConsole === 'function') {
                            console.log('✓ API now available, calling openConsole');
                            try {
                    window.api.openConsole();
                                console.log('✓ openConsole called successfully');
                            } catch (error) {
                                console.error('✗ Error calling openConsole:', error);
                                alert('无法打开 Console 窗口: ' + error.message);
                            }
                        } else if (attempts < maxAttempts) {
                            setTimeout(checkApi, 100);
                        } else {
                            console.error('✗ API not available after maximum attempts');
                            console.error('Final window.api:', window.api);
                            alert('无法打开 Console 窗口: API 初始化超时。请检查控制台日志。');
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
