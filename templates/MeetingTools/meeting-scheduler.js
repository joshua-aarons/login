import { CustomForm, SvgPlus } from "../../CustomComponent.js";
import { createSession, parseSession, updateSession } from "../../Firebase/New/sessions.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import {} from "../input-plus.js"

useCSSStyle("theme")

class MeetingScheduler extends CustomForm {
    onconnect(){
        this.sid = null;

        this.innerHTML = getHTMLTemplate("meeting-scheduler");
        // this.getInput("end-time").addEventListener("change", () => this.computeTime())
        this.attachEvents();
        
        this.appView = document.querySelector("app-view")
    }

    async save(){
        if (this.validate()) {
            let value = this.value;

            let time = new Date(value["start-time"]);
            time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
            value.startTime = time.getTime();

            this.loading = true;
            let data = null
            if (this.sid == null) {
                let sid = await createSession(value);
                data = parseSession(sid, {info: value}, true);
            } else {
                value.sid = this.sid;
                await updateSession(this.sid, value);
                data = parseSession(this.sid, {info: value}, true);
            }
            data.time = time.getTime();
            this.appView.displayMeeting(data);
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
            if (value.time) {
                value["start-time"] = value.time;
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