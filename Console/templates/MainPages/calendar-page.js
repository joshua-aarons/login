import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { UserDataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { Session } from "../../../Firebase/sessions.js";

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
        this._meetingsMap = new Map(); // Store meetings by sid for quick lookup
        this._allMeetings = []; // Store all meetings for search
        this._searchQuery = ''; // Current search query
        this._colorMap = new Map(); // Map sid to color for consistent coloring
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
        // Wait for FullCalendar to be loaded (from script tag)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        while (attempts < maxAttempts) {
            if (typeof FullCalendar !== 'undefined') {
                window.FullCalendar = FullCalendar;
                return true;
            }
            if (typeof window.FullCalendar !== 'undefined') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        return false;
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

        // Search functionality
        this.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action === 'toggle-search') {
                this.toggleSearchBox();
            } else if (action === 'close-search') {
                this.closeSearchBox();
            }
        });

        // Search input event
        const searchInput = this.querySelector('[name="searchInput"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this._searchQuery = e.target.value.trim().toLowerCase();
                this.applySearchFilter();
            });

            // Close search on Escape key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeSearchBox();
                }
            });
        }
    }

    toggleSearchBox() {
        const searchBox = this.querySelector('.search-box');
        const searchInput = this.querySelector('[name="searchInput"]');
        if (searchBox && searchInput) {
            searchBox.classList.toggle('active');
            if (searchBox.classList.contains('active')) {
                searchInput.focus();
            } else {
                this.closeSearchBox();
            }
        }
    }

    closeSearchBox() {
        const searchBox = this.querySelector('.search-box');
        const searchInput = this.querySelector('[name="searchInput"]');
        if (searchBox && searchInput) {
            searchBox.classList.remove('active');
            searchInput.value = '';
            this._searchQuery = '';
            this.applySearchFilter();
        }
    }

    applySearchFilter() {
        if (!this.weekCalendar || !this._allMeetings.length) {
            return;
        }

        let filteredMeetings = this._allMeetings;

        if (this._searchQuery) {
            filteredMeetings = this._allMeetings.filter(meeting => {
                // Search in title, description, sid
                const title = (meeting.title || '').toLowerCase();
                const description = (meeting.description || '').toLowerCase();
                const sid = (meeting.sid || '').toLowerCase();
                
                return title.includes(this._searchQuery) ||
                       description.includes(this._searchQuery) ||
                       sid.includes(this._searchQuery);
            });
        }

        // Update calendar with filtered events
        this.updateCalendarEvents(filteredMeetings);
    }

    /**
     * Generate a consistent color for a meeting based on its sid
     * Uses a theme-based color palette matching Squidly's purple/indigo theme
     */
    getEventColor(meeting) {
        // If meeting has a color, use it
        if (meeting.color) {
            return meeting.color;
        }
        
        // Use sid to generate consistent color
        const sid = meeting.sid || '';
        if (!sid) {
            return '#7c3aed'; // Default purple (theme color)
        }
        
        // Check if we already have a color for this sid
        if (this._colorMap.has(sid)) {
            return this._colorMap.get(sid);
        }
        
        // Theme-based color palette (purple/indigo theme matching Squidly)
        const themeColors = [
            '#7c3aed', // Purple (primary)
            '#6366f1', // Indigo
            '#8b5cf6', // Purple variant
            '#5b21b6', // Deep purple
            '#4f46e5', // Indigo variant
            '#a855f7', // Light purple
            '#3b82f6', // Blue
            '#2563eb', // Deep blue
            '#06b6d4', // Cyan
            '#10b981', // Green
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#ec4899', // Pink
            '#14b8a6', // Teal
            '#f97316', // Orange
        ];
        
        // Generate hash from sid to get consistent color
        let hash = 0;
        for (let i = 0; i < sid.length; i++) {
            hash = sid.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % themeColors.length;
        const color = themeColors[colorIndex];
        
        // Store color for this sid
        this._colorMap.set(sid, color);
        
        return color;
    }

    updateCalendarEvents(meetings) {
        if (!this.weekCalendar) {
            return;
        }

        // Store filtered meetings in map
        this._meetingsMap.clear();
        meetings.forEach(meeting => {
            if (meeting.sid) {
                this._meetingsMap.set(meeting.sid, meeting);
            }
        });

        // Convert meetings to events
        const events = meetings.map(meeting => {
            let durationMinutes = meeting.duration;
            if (typeof durationMinutes === 'string') {
                const match = durationMinutes.match(/(\d+)/);
                durationMinutes = match ? parseInt(match[1]) : 30;
            } else if (typeof durationMinutes === 'number') {
                durationMinutes = durationMinutes;
            } else {
                durationMinutes = 30;
            }
            
            const startTimeRaw = meeting.startTime !== undefined ? meeting.startTime : 
                                (meeting.time !== undefined ? meeting.time : null);
            let startDate;
            
            if (startTimeRaw instanceof Date) {
                startDate = startTimeRaw;
            } else if (typeof startTimeRaw === 'number' && !isNaN(startTimeRaw)) {
                startDate = new Date(startTimeRaw);
            } else if (typeof startTimeRaw === 'string') {
                startDate = new Date(startTimeRaw);
            } else {
                startDate = new Date();
            }
            
            if (isNaN(startDate.getTime())) {
                startDate = new Date();
            }
            
            const endTime = meeting.endTime instanceof Date 
                ? meeting.endTime 
                : (meeting.endTime ? new Date(meeting.endTime) : new Date(startDate.getTime() + durationMinutes * 60000));
            
            // Generate or retrieve color for this session
            const eventColor = this.getEventColor(meeting);
            
            return {
                title: meeting.title || meeting.description || 'Meeting',
                start: startDate,
                end: endTime,
                backgroundColor: eventColor,
                borderColor: eventColor,
                borderWidth: 2,
                extendedProps: {
                    sid: meeting.sid || '',
                    description: meeting.description || ''
                }
            };
        });

        // Update week calendar
        this.weekCalendar.removeAllEvents();
        events.forEach(event => {
            this.weekCalendar.addEvent(event);
        });

        // Update mini calendar
        if (this.miniCalendar) {
            this.miniCalendar.removeAllEvents();
            events.forEach(event => {
                this.miniCalendar.addEvent(event);
            });
        }
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
                headerToolbar: {
                    left: 'prev',
                    center: 'title',
                    right: 'next'
                },
                height: 'auto',
                fixedWeekCount: true, // Fixed 6 weeks to keep square shape
                dayMaxEvents: true, // Show event indicators (FullCalendar default)
                dayHeaderFormat: { weekday: 'narrow' }, // Use single letter (S, M, T, W, T, F, S)
                aspectRatio: 1.0, // Force square aspect ratio (width:height = 1:1)
                contentHeight: 'auto',
                events: [], // Will be populated in onvalue
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
            // Store reference to this for use in callbacks
            const self = this;
            this.weekCalendar = new FullCalendar.Calendar(weekCalendarEl, {
                initialView: 'timeGridWeek',
                headerToolbar: false,
                allDaySlot: false,
                slotMinTime: '00:00:00', // Full 24-hour range
                slotMaxTime: '24:00:00', // Full 24-hour range
                slotDuration: '00:30:00',
                height: 'auto', // Let CSS control height
                contentHeight: 'auto', // Auto height based on container
                scrollTime: '09:00:00', // Scroll to 9 AM initially
                slotLabelInterval: '01:00:00', // Show hour labels
                displayEventTime: true, // Show event time
                eventTimeFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    omitZeroMinute: false,
                    meridiem: 'short'
                },
                events: [],
                dateClick: (info) => {
                    // Handle date/time click - could open add event modal
                    console.log('Date clicked:', info.dateStr, info.timeStr);
                },
                eventClick: (info) => {
                    // Handle event click - navigate to meeting details page
                    console.log('[CalendarPage] Event clicked:', info.event);
                    console.log('[CalendarPage] Event title:', info.event.title);
                    console.log('[CalendarPage] Event extendedProps:', info.event.extendedProps);
                    console.log('[CalendarPage] Event id:', info.event.id);
                    
                    // Try multiple ways to get sid
                    const sid = info.event.extendedProps?.sid || 
                               info.event.id || 
                               (info.event.extendedProps && info.event.extendedProps.sid);
                    
                    console.log('[CalendarPage] Extracted sid:', sid);
                    console.log('[CalendarPage] self object:', self);
                    console.log('[CalendarPage] self.navigateToMeeting:', typeof self.navigateToMeeting);
                    
                    if (sid) {
                        console.log('[CalendarPage] Calling navigateToMeeting with sid:', sid);
                        try {
                            self.navigateToMeeting(sid);
                        } catch (error) {
                            console.error('[CalendarPage] Error calling navigateToMeeting:', error);
                        }
                    } else {
                        console.error('[CalendarPage] No sid found in event!');
                        console.error('[CalendarPage] Trying to find sid in meetingsMap...');
                        // Try to find by title
                        const meeting = Array.from(self._meetingsMap.values()).find(m => 
                            (m.description || m.title) === info.event.title
                        );
                        if (meeting && meeting.sid) {
                            console.log('[CalendarPage] Found meeting by title, sid:', meeting.sid);
                            self.navigateToMeeting(meeting.sid);
                        } else {
                            console.error('[CalendarPage] Could not find meeting');
                        }
                    }
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
            
            if (this._pendingMeetings && this._pendingMeetings.length > 0) {
                const value = { meetings: this._pendingMeetings };
                this._pendingMeetings = null;
                this.onvalue(value);
            }
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
            
            const dateRangeEl = this.querySelector('[name="dateRange"]');
            if (dateRangeEl) {
                const viewType = view.type;
                
                if (viewType === 'timeGridDay') {
                    // Day view: Show specific date, e.g., "Jan 13, 2024"
                    const day = start.getDate();
                    const month = start.toLocaleDateString('en-US', { month: 'short' });
                    const year = start.getFullYear();
                    dateRangeEl.textContent = `${month} ${day}, ${year}`;
                } else if (viewType === 'timeGridWeek') {
                    // Week view: Show week range, e.g., "Jan 13 - 19, 2024"
                    const startDay = start.getDate();
                    const endDay = end.getDate() - 1; // end is exclusive, so subtract 1
                    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
                    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
                    const year = start.getFullYear();
                    
                    if (startMonth === endMonth) {
                        dateRangeEl.textContent = `${startMonth} ${startDay} - ${endDay}, ${year}`;
                    } else {
                        dateRangeEl.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
                    }
                } else {
                    // Month view: Show month and year, e.g., "Jan 2024"
                    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
                    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
                    const year = start.getFullYear();
                    
                if (startMonth === endMonth) {
                    dateRangeEl.textContent = `${startMonth} ${year}`;
                } else {
                    dateRangeEl.textContent = `${startMonth} - ${endMonth} ${year}`;
                }
            }
        }
    }
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
        if (value && value.meetings && Array.isArray(value.meetings) && value.meetings.length > 0) {
            if (!this.weekCalendar) {
                this._pendingMeetings = value.meetings;
                return;
            }
            
            // Store all meetings for search
            this._allMeetings = value.meetings;
            
            // Apply search filter if there's an active search query
            if (this._searchQuery) {
                this.applySearchFilter();
            } else {
                // No search filter, show all meetings
                this.updateCalendarEvents(value.meetings);
            }
        } else if (value && value.meetings && value.meetings.length === 0) {
            // No meetings
            this._allMeetings = [];
            if (this.weekCalendar) {
            this.weekCalendar.removeAllEvents();
            }
            if (this.miniCalendar) {
                this.miniCalendar.removeAllEvents();
            }
            this._meetingsMap.clear();
        }
    }


    /**
     * Navigate to meeting details page
     * @param {string} sid - The session ID
     */
    navigateToMeeting(sid) {
        const isDashboardWindow = document.body.classList.contains('dashboard-window');
        
        // Find meeting from current data
        const meeting = this._meetingsMap.get(sid);
        if (!meeting) {
            console.warn('[CalendarPage] Meeting not found for sid:', sid);
            return;
        }
        
        const sessionData = this.convertMeetingToSession(meeting);
        
        if (isDashboardWindow) {
            // In Dashboard window, use displayMeeting method (same as Console)
            const dashboardWelcome = document.querySelector('dashboard-welcome');
            if (dashboardWelcome && typeof dashboardWelcome.displayMeeting === 'function') {
                dashboardWelcome.displayMeeting(sessionData);
            } else {
                console.error('[CalendarPage] dashboard-welcome.displayMeeting not found');
            }
        } else {
            // In Console window, use app-view displayMeeting method
            if (window.appView && typeof window.appView.displayMeeting === 'function') {
                window.appView.displayMeeting(sessionData);
            }
        }
    }

    /**
     * Convert meeting object to Session-like object for meeting-display component
     * @param {Object} meeting - The meeting object
     * @returns {Object} Session-like object
     */
    convertMeetingToSession(meeting) {
        // Parse duration
        let durationMinutes = meeting.duration;
        if (typeof durationMinutes === 'string') {
            const match = durationMinutes.match(/(\d+)/);
            durationMinutes = match ? parseInt(match[1]) : 30;
        } else if (typeof durationMinutes === 'number') {
            durationMinutes = durationMinutes;
        } else {
            durationMinutes = 30;
        }
        
        // Parse start time
        const startTimeRaw = meeting.startTime !== undefined ? meeting.startTime : 
                            (meeting.time !== undefined ? meeting.time : 
                            (meeting.date instanceof Date ? meeting.date.getTime() : 
                            (meeting.date ? new Date(meeting.date).getTime() : null)));
        let startTime;
        
        if (startTimeRaw instanceof Date) {
            startTime = startTimeRaw.getTime();
        } else if (typeof startTimeRaw === 'number' && !isNaN(startTimeRaw)) {
            startTime = startTimeRaw;
        } else if (typeof startTimeRaw === 'string') {
            startTime = new Date(startTimeRaw).getTime();
        } else {
            startTime = Date.now();
        }
        
        if (isNaN(startTime)) {
            startTime = Date.now();
        }
        
        const startDate = new Date(startTime);
        
        // Format date string (DD/MM/YYYY HH:MM AM/PM)
        const day = String(startDate.getDate()).padStart(2, '0');
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const year = startDate.getFullYear();
        const timeStr = startDate.toLocaleTimeString("en", { timeStyle: "short" });
        const dateStr = `${day}/${month}/${year} ${timeStr}`;
        
        // Create Session-like object
        const sessionData = {
            sid: meeting.sid || '',
            description: meeting.description || meeting.title || 'My Meeting',
            date: dateStr,
            duration: durationMinutes,
            time: startTime,
            startTime: startTime,
            timezone: meeting.timezone || '-',
            status: meeting.status || (meeting.isHistory ? 'complete' : 'upcoming'),
            isHistory: meeting.isHistory || false,
            active: meeting.active || false,
            link: Session.sid2link(meeting.sid || ''),
            // Add delete method
            delete: async function() {
                // Import deleteSession dynamically to avoid circular dependency
                const { deleteSession } = await import("../../../Firebase/sessions.js");
                if (this.isHistory) {
                    const { getUser } = await import("../../../Firebase/firebase-client.js");
                    const { ref, set } = await import("../../../Firebase/firebase-client.js");
                    const uid = getUser().uid;
                    const r = ref(`users/${uid}/session-history/${this.sid}`);
                    await set(r, null);
                } else {
                    await deleteSession(this.sid);
                }
                return true;
            }
        };
        
        return sessionData;
    }
}

// Register as custom element
SvgPlus.defineHTMLElement(CalendarPage);

export { CalendarPage };
