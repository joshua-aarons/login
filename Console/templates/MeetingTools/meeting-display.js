import { DataComponent, SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { deleteSession, Session } from "../../../Firebase/sessions.js"
import { getUserInfo } from "../../../Firebase/user.js"
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"

useCSSStyle("meeting-display")
useCSSStyle("theme")

// let charSizes = []
// function computeCharacterWidths(ref){
//     let style = window.getComputedStyle(ref);
//     let els = [];
//     for (let i = 0; i < 255; i++) {
//         let text = new SvgPlus("div");
//         text.innerHTML = String.fromCharCode(i);
//         text.styles = {
//             "font-family": style.fontFamily, 
//             "font-size": style.fontSize, 
//             "font-weight": style.fontWeight, 
//             "display": "inline-block",
//              position: "fixed", 
//              "opacity": "0"
//         };
//         document.body.prepend(text);
//         els.push(text);
//     }
    
//     window.requestAnimationFrame(() => {
//         charSizes = []
//         for (let el of els) {
//             charSizes.push(el.bbox[1].x);
//             el.remove();
//         }
//     })
// }

// function cropToLength(string, length) {
//     let result = "";
//     let l = 0;
//     if (charSizes.length > 0) {
//         for (let char of string) {
//             let wchar = charSizes[char.charCodeAt(0)]
//             if (l + wchar < length) {
//                 result += char;
//                 l += wchar;
//             } else {
//                 break;
//             }
//         }
//     }
//     return result;
// }

// function getStringLength(string) {
//     let l = 0;
//     if (charSizes.length > 0) 
//         for (let i = 0; i < string.length; i++) 
//             l += charSizes[string.charCodeAt(i)];
//     return l;
// }


const TimeZones = {
    "(UTC+08:00) Perth": 8,
    "(UTC+09:30) Darwin": 9.5,
    "(UTC+10:00) Brisbane": 10,
    "(UTC+10:30) Adelaide": 10.5,
    "(UTC+11:00) Canberra, Melbourne, Sydney": 11,
    "(UTC+11:00) Hobart": 11,
    "(GMT+8:00) Perth": 8,
    "(GMT+9:30) Darwin": 9.5,
    "(GMT+10:00) Brisbane": 10,
    "(GMT+10:30) Adelaide": 10.5,
    "(GMT+11:00) Canberra, Melbourne, Sydney": 11,
    "(GMT+11:00) Hobart": 11
}

const LINK_FORMAT_TOKENS = {
    ":": "%3A",
    "/": "%2F",
    "?": "%3F"
}


/**
 * @extends HTMLElement
 */
class MeetingDisplay extends UserDataComponent {
    
    constructor(el) {
        if (!el) {
            el = document.createElement('div');
        }
        super(el);
    }
    
    onconnect() {
        this.template = getHTMLTemplate("meeting-display")
        
        // Setup close button handler
        const closeBtn = this.querySelector('.close-i');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }
    
    
    /**
     * Convert meeting object to Session-like object
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
    
    onvalue(value) {
        // Update complete attribute
        if (value && value.status) {
            this.toggleAttribute("complete", value.status === "complete");
        }
    }

    /**
     * Copies the meeting link to the clipboard
     * @return {Promise<void>}
     */
    async copyLink() {
        if (this.value && this.value.link) {
            let link = this.value.link;
            let copyItems = new ClipboardItem({
                "text/plain": new Blob([link], {type: 'text/plain'})
            });
            try {
                await navigator.clipboard.write([copyItems])
                showNotification("Link copied to clipboard.", 3000, "success");
            } catch (err) {
                showNotification("Failed to copy link.", 5000, "success");
            }
        }
    }

    /**
     * Copies the meeting invite HTML to the clipboard
     * @return {Promise<void>}
     */
    async copy(){
        let {displayName} = await getUserInfo();
        let {date, description, link, timezone} = this.value;
        let html = `<div><b>${displayName} has invited you to a Squidly session.</b></div>
        <div><b>Topic:</b> <span>${description}</span></div>
        <div><b>Date:</b> <span>${date} ${timezone}</span></div>
        <div><b>link:</b> <span>${link}</span></div>`
        let blob = new Blob([html], {type:'text/html'})
        let copyItems = new ClipboardItem({
            "text/html": blob
        }) 
        try {
            await navigator.clipboard.write([copyItems])
            showNotification("Session invite copied to clipboard.", 3000, "success");
        }  catch (err) {
            showNotification("Failed to copy session invite.", 5000, "error");
        }
    }

    close() {
        const isDashboardWindow = document.body.classList.contains('dashboard-window');
        
        if (isDashboardWindow) {
            // In Dashboard window, use dashboard-welcome's closeMeetingDisplay method
            const dashboardWelcome = document.querySelector('dashboard-welcome');
            if (dashboardWelcome && typeof dashboardWelcome.closeMeetingDisplay === 'function') {
                dashboardWelcome.closeMeetingDisplay();
            } else {
                // Fallback: close popup directly
                const popup = document.querySelector('[name="meetingDisplayPopup"]');
                if (popup) {
                    popup.classList.remove('open');
                }
            }
        } else {
            // In Console window, close popup (same as before)
            if (this.parentNode && this.parentNode.classList) {
                this.parentNode.classList.remove('open');
            }
        }
    }

    async deleteMeeting(){
        this.toggleAttribute("loading", true);
        if (this.value) {
            try {
                if (!await this.value.delete()) {
                    throw "error"
                }
            } catch (e) {
                showNotification("Failed to delete session.", 5000, "error");
            }
        }
        this.close();
        this.toggleAttribute("loading", false);
    }

    edit(){
        this.close()
        // Support both Console (app-view) and Dashboard windows
        const isDashboardWindow = document.body.classList.contains('dashboard-window');
        if (isDashboardWindow) {
            // In Dashboard, we might not have meeting scheduler yet
            // For now, just show a notification or open console
            if (window.api && typeof window.api.openConsole === 'function') {
                window.api.openConsole();
            } else {
                showNotification("Please use Console to edit meetings.", 3000, "info");
            }
        } else {
            // In Console, use app-view
            const appView = document.querySelector("app-view");
            if (appView && typeof appView.scheduleMeeting === 'function') {
                appView.scheduleMeeting(this.value);
            }
        }
    }

    
    addToGoogleCalender(){
        let {time, description, duration, link} = this.value;

        let start = new Date(time);
        start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
        let end = new Date(start.getTime() + duration * 60 * 1000);

        let f = (sd) => `${sd.getFullYear()}${(""+(sd.getMonth()+1)).padStart(2, 0)}${(""+(sd.getDate())).padStart(2, 0)}T${(""+sd.getHours()).padStart(2,0)}${(""+sd.getMinutes()).padStart(2,0)}00Z`;
        
        let linkf = link.replace(/:|\?|\//g, (a) => LINK_FORMAT_TOKENS[a]);
        let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${f(start)}%2F${f(end)}&location=${linkf}&text=${description.replace(" ", "%20")}`
        window.open(url);
    }

    addToOutlook(){
        let {time, description, duration, link} = this.value;

        let start = new Date(time);
        start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
        let end = new Date(start.getTime() + duration * 60 * 1000);

        let linkf = link.replace(/:|\?|\//g, (a) => LINK_FORMAT_TOKENS[a]);
        let f = (sd) => `${sd.getFullYear()}-${(""+(sd.getMonth()+1)).padStart(2, 0)}-${(""+(sd.getDate())).padStart(2, 0)}T${(""+sd.getHours()).padStart(2,0)}%3A${(""+sd.getMinutes()).padStart(2,0)}%3A00%2B00%3A00`;
        let url = `https://outlook.office.com/calendar/0/action/compose?allday=false&enddt=${f(end)}&location=${linkf}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${f(start)}&subject=${description}`
        window.open(url);
    }
}

SvgPlus.defineHTMLElement(MeetingDisplay)
