import { CustomForm, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { createSession, updateSession } from "../../../Firebase/sessions.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import {} from "../../../Utilities/templates/input-plus.js"

useCSSStyle("theme")

function firstDayInMonth(year, month, day) {
    let date = new Date(year, month, 1, 0, 0, 0, 0);
    let d = date.getDay();
    if (d === day) {
        return date;
    } else {
        // If the first day is not Sunday, calculate the next Sunday
        date.setDate(date.getDate() + (day - d + 7) % 7);
        return date;
    }
}

function isInAustralianDST(date) {
    // Get the year and month from the date
    let year = date.getFullYear();

    let end = firstDayInMonth(year, 3, 0).getTime(); // First Sunday in April
    let start = firstDayInMonth(year, 9, 0).getTime(); // First Sunday in October

    date = date.getTime();

    // Check if the date is between the first Sunday in April and the first Sunday in October
    return (date >= start || date <= end);
}
const daylightSaving = {
    "Perth": 0,
    "Adelaide": 100,
    "Brisbane": 0,
    "Darwin": 0,
    "Hobart": 100,
    "Sydney, Melbourne, Canberra": 100
}
const TimeZones = {
    "Perth": 800,
    "Adelaide": 950,
    "Brisbane": 1000,
    "Darwin": 950,
    "Hobart": 1000,
    "Sydney, Melbourne, Canberra": 1000
}

function createTimeZonedDateString(timezone, date) {
    let dateO = new Date(date);
    let offset = TimeZones[timezone] || 0;
    if (daylightSaving[timezone] > 0 && isInAustralianDST(dateO)) {
        offset += daylightSaving[timezone];
    }
    let offsetString = (offset > 0 ? "+" : "-") + (Math.floor(offset / 100)+"").padStart(2, '0') + ":" + (Math.round(60 * (offset % 100) / 100)).toString().padStart(2, '0');
    date =  date + offsetString;
    return date;
}


class MeetingScheduler extends CustomForm {
    onconnect(){
        this.sid = null;
        this.innerHTML = getHTMLTemplate("meeting-scheduler");
        this.attachEvents();
        this.appView = document.querySelector("app-view")
    }

    async save(){
        if (this.validate()) {
            let {value, sid} = this;
            let sessionInfo = {
                duration: parseInt(value.duration) || 5,
                description: value.description || "My Meeting",
                timezone: value.timezone,
                startDate: createTimeZonedDateString(value.timezone, value["start-time"]),
            }
            sessionInfo.startTime = new Date(sessionInfo.startDate).getTime();
            
            this.loading = true;
            let session = null;
            if (sid == null) {
                session = await createSession(sessionInfo);
            } else {
                session = await updateSession(sid, sessionInfo);
            }
            this.appView.displayMeeting(session);
            this.parentNode.classList.remove("open");
            this.loading = false;
            this.value = "";
        }
    }

    onValue(value){
        if (value && typeof value === "object") {
            if (value.sid) {
                this.sid = value.sid;
            } else {
                this.sid = null;
            }
            if (value.startDate && value.timezone) {
                const {startDate} = value;
                let match = startDate.match(/\d{4}-\d{2}-\d{2}[T]\d{2}:\d{2}/);
                value["start-time"] = match[0];
            }
        }
        return value;
    }

    close(){
        this.value = "";
        this.parentNode.classList.remove("open");
    }

    validate(){
        let valid = super.validate()
        var start = Date.parse(this.getInputValue("start-time")); //get timestamp
        var end = Date.parse(this.getInputValue("end-time")); //get timestamp
        if (end < start){
            valid = false
            this.getInput('end-time').error = 'End time must be after the start time'
        }
        return valid
    }

    computeTime(){
        var start = Date.parse(this.getInputValue("start-time")); //get timestamp
        var end = Date.parse(this.getInputValue("end-time")); //get timestamp
        let totalHours = NaN;
        if (start < end) {
            totalHours = Math.floor((end - start) / 1000 / 60); //milliseconds: /1000 / 60 / 60
        }
        this.setInputValue("duration", totalHours);
    }
}

SvgPlus.defineHTMLElement(MeetingScheduler);