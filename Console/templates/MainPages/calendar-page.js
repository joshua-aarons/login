import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { UserDataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";

useCSSStyle("theme");
useCSSStyle("calendar-page");

class CalendarPage extends UserDataComponent {
    constructor(el) {
        if (!el) {
            el = document.createElement('div');
        }
        super(el);
        this.currentDate = new Date();
        this.miniCalendar = null;
        this.weekCalendar = null;
        this.currentView = 'timeGridWeek';
    }

    async onconnect() {
        // Get template from TemplateData
        let template = getHTMLTemplate("calendar-page");
        
        // If template is empty, wait for template loading to complete
        if (!template || template.length === 0) {
            const templateModule = await import("../../../Utilities/template.js");
            if (templateModule.Loading instanceof Promise) {
                await templateModule.Loading;
            }
            template = getHTMLTemplate("calendar-page");
        }
        
        // Only set template if innerHTML is empty (template setter sets innerHTML)
        if (this.innerHTML.length === 0 && template && template.length > 0) {
            this.template = template;
        }
        
        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Wait for FullCalendar to be loaded
        await this.waitForFullCalendar();
        
        this.setupEventListeners();
        this.initCalendars();
    }

    async waitForFullCalendar() {
        // With local files, FullCalendar should be available immediately
        // Just check a few times with minimal delay
        let attempts = 0;
        const maxAttempts = 10; // 1 second max (should be instant with local files)
        
        while (attempts < maxAttempts) {
            // Check for FullCalendar
            if (typeof FullCalendar !== 'undefined') {
                window.FullCalendar = FullCalendar;
                console.log('[CalendarPage] ✓ FullCalendar found');
                return true;
            }
            if (typeof window.FullCalendar !== 'undefined') {
                console.log('[CalendarPage] ✓ FullCalendar found on window');
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // If still not found, try CDN fallback
        console.warn('[CalendarPage] FullCalendar not found locally, trying CDN fallback...');
        try {
            await this.loadFullCalendarFallback();
            if (typeof FullCalendar !== 'undefined' || typeof window.FullCalendar !== 'undefined') {
                console.log('[CalendarPage] ✓ FullCalendar loaded via CDN fallback');
                return true;
            }
        } catch (error) {
            console.error('[CalendarPage] CDN fallback failed:', error);
        }
        
        console.error('[CalendarPage] ✗ FullCalendar not available');
        return false;
    }

    async loadFullCalendarFallback() {
        return new Promise((resolve, reject) => {
            // Check if already exists
            const existing = document.querySelector('script[src*="fullcalendar"]');
            if (existing && existing.complete) {
                setTimeout(() => {
                    if (typeof FullCalendar !== 'undefined') {
                        window.FullCalendar = FullCalendar;
                        resolve();
                    } else {
                        reject(new Error('Script loaded but FullCalendar not available'));
                    }
                }, 100);
                return;
            }
            
            // Try CDN as fallback
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js';
            script.async = false;
            
            script.onload = () => {
                setTimeout(() => {
                    if (typeof FullCalendar !== 'undefined') {
                        window.FullCalendar = FullCalendar;
                        resolve();
                    } else {
                        reject(new Error('FullCalendar not available after script load'));
                    }
                }, 200);
            };
            
            script.onerror = () => reject(new Error('Script failed to load'));
            document.head.appendChild(script);
        });
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

        // Calendar navigation buttons
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-btn, .today-btn');
            if (btn) {
                const action = btn.dataset.action;
                if (action === 'prev') {
                    this.navigateWeek(-1);
                } else if (action === 'next') {
                    this.navigateWeek(1);
                } else if (action === 'today') {
                    this.goToToday();
                }
            }
        });

        // View toggle buttons
        this.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-btn');
            if (viewBtn) {
                const view = viewBtn.dataset.view;
                this.switchView(view);
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

    initCalendars() {
        if (typeof FullCalendar === 'undefined') {
            console.error('[CalendarPage] FullCalendar is not available');
            return;
        }
        
        // Initialize mini calendar (left sidebar)
        const miniCalendarEl = this.querySelector('#mini-calendar');
        if (miniCalendarEl) {
            this.miniCalendar = new FullCalendar.Calendar(miniCalendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: false,
                height: 'auto',
                fixedWeekCount: false,
                dayMaxEvents: false,
                dateClick: (info) => {
                    // When clicking a date in mini calendar, navigate week calendar to that week
                    if (this.weekCalendar) {
                        this.weekCalendar.gotoDate(info.dateStr);
                    }
                },
                datesSet: (dateInfo) => {
                    // Sync mini calendar date with week calendar
                    this.updateDateRange();
                }
            });
            this.miniCalendar.render();
        }

        // Initialize week calendar (main content)
        const weekCalendarEl = this.querySelector('#week-calendar');
        if (weekCalendarEl) {
            this.weekCalendar = new FullCalendar.Calendar(weekCalendarEl, {
                initialView: 'timeGridWeek',
                headerToolbar: false,
                allDaySlot: false,
                slotMinTime: '09:00:00',
                slotMaxTime: '17:00:00',
                slotDuration: '00:15:00',
                height: 'auto',
                events: this.getSampleEvents(),
                dateClick: (info) => {
                    // Handle date/time click - could open add event modal
                    console.log('Date clicked:', info.dateStr, info.timeStr);
                },
                eventClick: (info) => {
                    // Handle event click - could open event details modal
                    console.log('Event clicked:', info.event.title);
                },
                datesSet: (dateInfo) => {
                    // Update date range display and sync mini calendar
                    this.updateDateRange();
                    if (this.miniCalendar) {
                        this.miniCalendar.gotoDate(dateInfo.start);
                    }
                }
            });
            this.weekCalendar.render();
        }
    }

    navigateWeek(direction) {
        if (this.weekCalendar) {
            if (direction < 0) {
                this.weekCalendar.prev();
            } else {
                this.weekCalendar.next();
            }
        }
    }

    goToToday() {
        const today = new Date();
        if (this.weekCalendar) {
            this.weekCalendar.gotoDate(today);
        }
        if (this.miniCalendar) {
            this.miniCalendar.gotoDate(today);
        }
    }

    switchView(view) {
        // Update view toggle buttons
        const viewBtns = this.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Switch calendar view
        if (this.weekCalendar) {
            let fcView = 'timeGridWeek';
            if (view === 'day') {
                fcView = 'timeGridDay';
            } else if (view === 'month') {
                fcView = 'dayGridMonth';
            }
            this.weekCalendar.changeView(fcView);
            this.currentView = fcView;
        }
    }

    updateDateRange() {
        if (this.weekCalendar) {
            const view = this.weekCalendar.view;
            const start = view.activeStart;
            const end = view.activeEnd;
            
            const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
            const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
            const year = start.getFullYear();
            
            const dateRangeEl = this.querySelector('[name="dateRange"]');
            if (dateRangeEl) {
                if (startMonth === endMonth) {
                    dateRangeEl.textContent = `${startMonth} ${year}`;
                } else {
                    dateRangeEl.textContent = `${startMonth} - ${endMonth} ${year}`;
                }
            }
        }
    }

    getSampleEvents() {
        // Sample events matching the prototype
        const today = new Date();
        const events = [];
        
        // Monday events
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1); // Get Monday of current week
        
        events.push({
            title: 'Brief internship',
            start: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 9, 0),
            end: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 10, 15),
            backgroundColor: '#10b981',
            borderColor: '#10b981'
        });
        
        events.push({
            title: 'Meeting with Saban K.',
            start: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 12, 0),
            end: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 13, 15),
            backgroundColor: '#8b5cf6',
            borderColor: '#8b5cf6'
        });
        
        events.push({
            title: 'Consultation Reesearch',
            start: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 14, 0),
            end: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 15, 15),
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b'
        });
        
        // Tuesday events
        const tuesday = new Date(monday);
        tuesday.setDate(monday.getDate() + 1);
        
        events.push({
            title: '(No Title)',
            start: new Date(tuesday.getFullYear(), tuesday.getMonth(), tuesday.getDate(), 9, 0),
            end: new Date(tuesday.getFullYear(), tuesday.getMonth(), tuesday.getDate(), 10, 0),
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6'
        });
        
        // Wednesday events
        const wednesday = new Date(monday);
        wednesday.setDate(monday.getDate() + 2);
        
        events.push({
            title: 'Video Conference',
            start: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 11, 0),
            end: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 12, 15),
            backgroundColor: '#14b8a6',
            borderColor: '#14b8a6'
        });
        
        events.push({
            title: 'Analysis Project Mint',
            start: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 15, 0),
            end: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 16, 15),
            backgroundColor: '#14b8a6',
            borderColor: '#14b8a6'
        });
        
        // Thursday events
        const thursday = new Date(monday);
        thursday.setDate(monday.getDate() + 3);
        
        events.push({
            title: 'Bootcamp UX Writing',
            start: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 13, 0),
            end: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 14, 15),
            backgroundColor: '#10b981',
            borderColor: '#10b981'
        });
        
        events.push({
            title: 'Conduct Research',
            start: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 14, 45),
            end: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 15, 40),
            backgroundColor: '#10b981',
            borderColor: '#10b981'
        });
        
        // Friday events
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        
        events.push({
            title: 'Meeting',
            start: new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 16, 0),
            end: new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 17, 0),
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b'
        });
        
        return events;
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
        
        // Update active nav item in calendar-page
        const navItems = this.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.route === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    onvalue(value) {
        // Update calendar with real events from user data
        if (value && value.meetings && this.weekCalendar) {
            // Convert meetings data to FullCalendar events format
            const events = value.meetings.map(meeting => ({
                title: meeting.title || meeting.description || 'Meeting',
                start: meeting.date || meeting.time,
                end: meeting.endTime || new Date(new Date(meeting.date || meeting.time).getTime() + (meeting.duration || 60) * 60000),
                backgroundColor: meeting.color || '#3b82f6',
                borderColor: meeting.color || '#3b82f6'
            }));
            this.weekCalendar.removeAllEvents();
            this.weekCalendar.addEventSource(events);
        }
    }
}

// Register as custom element
SvgPlus.defineHTMLElement(CalendarPage);

export { CalendarPage };
