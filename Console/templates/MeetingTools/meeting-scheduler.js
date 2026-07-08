import { addUserDataListener, CustomForm, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { createSession, updateSession } from "../../../Firebase/sessions.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import {} from "../../../Utilities/templates/input-plus.js"
import { getFormattedParts, TimeZoneList, TimeZonesByName } from "../../../Utilities/timezones.js";

useCSSStyle("theme")
const DEBUG = () => {};
// (...args) => console.log("%cMS:", "color: rgb(115, 255, 150); background: black; padding: 4px; border-radius: 4px;", ...args);
class MeetingScheduler extends CustomForm {
    onconnect(){
        this.sid = null;
        this.innerHTML = getHTMLTemplate("meeting-scheduler");
        this.attachEvents();
        this.appView = document.querySelector("app-view");
        this.isOpen = false;

        this._buildTimezoneSelection();
        DEBUG("initial reset")
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
        addUserDataListener( (userData) => {

            let name = userData?.info?.displayName || userData?.info?.name || "";
            name = name.trim();

            let description = "My Meeting";
            if (name.length > 0) {
                description = name[name.length -1] === "s" ? name + "' Meeting" : name + "'s Meeting";
            }
            this.defaultDescription = description;

            DEBUG(`data updated class: "${this.parentNode.getAttribute("class")}" ${this.isOpen ? "" : "-> resetting form"}`);
            if (!this.isOpen) {
                this._resetForm();
            }
        } );

    }

    // get isOpen() {
    //     return this.parentNode.classList.contains("open");
    // }


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
        this.setInputValue("description", this.defaultDescription || "My Meeting");
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
        const timezoneSelection = this.getInput("timezone").input
        if (!timezoneSelection) return;
        for (let {name, offsetString} of TimeZoneList) {
            // let option = new SvgPlus("option");
            // option.value = name;
            // option.textContent = `${name} (${offsetString})`
            timezoneSelection.addOption(name, `${name} (${offsetString})`)
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
            DEBUG("saving meeting");
            let {value: {duration, description, timezone, startTime, anonymous}, sid} = this;
            const startDate = startTime + TimeZonesByName[timezone].offsetStringPlain
            let sessionInfo = {
                duration: parseInt(duration) || 5,
                description: description || "My Meeting",
                timezone: timezone,
                startDate,  
                anonymous: !!anonymous,
                startTime: new Date(startDate).getTime() // start time in milliseconds
            }

            this.loading = true;
            try {
                // Create or update the session
                let session = await (sid == null ? createSession(sessionInfo) : updateSession(sid, sessionInfo));
                DEBUG("session created/updated", session);
                // Display the meeting in the app view
                this.appView.displayMeeting(session);

                DEBUG("meeting displayed in app view");
                // Close the scheduler
                this.close();
    
            } catch (e) {
                // Handle errors (e.g., missing license)
                window.showNotification("You will need a licence to schedule meetings.", 5000, "error");
                console.warn(e);
            }
            DEBUG("done saving meeting");
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
        this.sid = null;
        if (value && typeof value === "object") {
            if (value.sid) {
                this.sid = value.sid;
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
        DEBUG("closing")
        this.isOpen = false;
        this.parentNode.classList.remove("open");
        setTimeout(() => {
            this.value = "";
            this._resetForm();
        }, 500);
    }

}

SvgPlus.defineHTMLElement(MeetingScheduler);