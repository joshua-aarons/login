import { CustomForm, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { createSession, updateSession } from "../../../Firebase/sessions.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import {} from "../../../Utilities/templates/input-plus.js"
import { getFormattedParts, TimeZoneList, TimeZonesByName } from "../../../Utilities/timezones.js";

useCSSStyle("theme")

class MeetingScheduler extends CustomForm {
    onconnect(){
        this.sid = null;
        this.innerHTML = getHTMLTemplate("meeting-scheduler");
        this.attachEvents();
        this.appView = document.querySelector("app-view");

        this._buildTimezoneSelection();
        this._resetForm();

        this.getInput("duration").validater = (value) => {
            const num = parseInt(value);
            if (Number.isNaN(num)) {
                throw "Please enter a valid number for duration.";
            } else if (num < 1 ) {
                throw "Duration must be at least 1 minute.";
            } 
            return true;
        }
    }


    _resetForm(){
        // Set default start time to the next quarter hour
        const now = new Date();
        now.setMinutes(Math.ceil(now.getMinutes()/15) * 15);

        
        // Get the user's current time zone
        const time = getFormattedParts({ 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'long',
            hourCycle: 'h24'
        }, now);

        // Reset form values
        const datetime = `${time.year}-${time.month}-${time.day}T${time.hour}:${time.minute}`
        this.setInputValue("duration", 30);
        this.setInputValue("startTime", datetime);
        this.setInputValue("timezone", time.timeZoneName);
    }

    /**
     * Builds the timezone selection dropdown by populating it with
     * options derived from the TimeZoneList. Each option displays the
     * timezone name along with its corresponding offset.
     */
    _buildTimezoneSelection(){
        this.initialised = true;
        const timezoneSelection = this.getInput("timezone").input;
        if (!timezoneSelection) return;
        timezoneSelection.innerHTML = "";
        for (let {name, offsetString} of TimeZoneList) {
            let option = new SvgPlus("option");
            option.value = name;
            option.textContent = `${name} (${offsetString})`
            timezoneSelection.appendChild(option);
        }
    }

    /**
     * Either schedules a new meeting or updates an existing one.
     * Validates the form inputs before proceeding.
     * On success, displays the meeting in the app view and closes the scheduler.
     * On failure, shows a notification about licensing requirements.
     * 
     * @returns {Promise<void>}
     */
    async save(){
        if (this.validate()) {
            let {value: {duration, description, timezone, startTime}, sid} = this;
            const startDate = startTime + TimeZonesByName[timezone].offsetStringPlain
            let sessionInfo = {
                duration: parseInt(duration) || 5,
                description: description || "My Meeting",
                timezone: timezone,
                startDate,  
                startTime: new Date(startDate).getTime() // start time in milliseconds
            }

            this.loading = true;
            try {
                // Create or update the session
                let session = await (sid == null ? createSession(sessionInfo) : updateSession(sid, sessionInfo));
                
                // Display the meeting in the app view
                this.appView.displayMeeting(session);

                // Close the scheduler
                this.close();
            } catch (e) {
                // Handle errors (e.g., missing license)
                window.showNotification("You will need a licence to schedule meetings.", 5000, "error");
                console.warn(e);
            }
            this.loading = false;
        }
    }


    /**
     * Called before setting the value of the component.
     * Extracts and sets the session ID and start time from the provided value object.
     * 
     * @param {Object} value - The value object containing session details.
     * @returns {Object} - The processed value object.
     */
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
                value["startTime"] = match[0];
            }
        }
        return value;
    }

    /**
     * Closes the meeting scheduler by clearing its value,
     * removing the "open" class from its parent node,
     * and resetting the form fields to their default state.
     */
    close(){
        this.value = "";
        this.parentNode.classList.remove("open");
        this._resetForm();
    }

}

SvgPlus.defineHTMLElement(MeetingScheduler);