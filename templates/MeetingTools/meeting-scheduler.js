import { CustomForm, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import {} from "../input-plus.js"

useCSSStyle("theme")

class MeetingScheduler extends CustomForm {
    onconnect(){
        this.innerHTML = getHTMLTemplate("meeting-scheduler");

        const save = this.querySelector("button[name = 'save'");
        const cancel = this.querySelector("button[name = 'cancel']");

        cancel.addEventListener("click", () => {
            const event = new Event("close");
            this.dispatchEvent(event);
            this.value = "";
            this.parentNode.classList.remove("open");

        });

        save.addEventListener("click", () => {
            if (this.validate()) {
                let meeting = this.value;
                const event = new Event("save");
                event.data = meeting;
                this.dispatchEvent(event);
                this.parentNode.classList.remove("open");
                this.value = "";
            }
        });

        this.getInput("end-time").addEventListener("change", () => this.computeTime())

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
        this.setInputValue("time-stamp", totalHours);
    }
}

SvgPlus.defineHTMLElement(MeetingScheduler);