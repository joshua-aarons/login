import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import {} from "../input-plus.js"

useCSSStyle("theme")

class MeetingScheduler extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("meeting-scheduler");

        const save = this.querySelector("button[name = 'save'");
        const cancel = this.querySelector("button[name = 'cancel']");

        cancel.addEventListener("click", () => {
            const event = new Event("close");
            this.dispatchEvent(event);
            this.value = "";
        });

        save.addEventListener("click", () => {
            let meeting = this.value;
            if (meeting == null) {
                alert('please finish meeting')
            } else {
                const event = new Event("save");
                event.data = meeting;
                this.dispatchEvent(event);
                this.classList.remove("open");
            }
        });

        this.getInput("end-time").addEventListener("change", () => this.computeTime())

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

    setInputValue(name, value) {
        let input = this.getInput(name);
        if (input) input.value = value;
    }

    getInputValue(name) {
        let value = "";
        let input = this.getInput(name);
        if (input) value = input.value;
        return value;
    }

    getInput(name) {
        let input = null
        for (let i of this.inputs) {
            if (i.name == name) {
                input = i;
            }
        }
        return input;
    }

    get inputs(){
        return this.querySelectorAll("input-plus");
    }

    set value(value) {
        if (typeof value !== "object" || value == null) value = {}
        for(let input of this.inputs){
            let name = input.name
            let input_value = "";
            if (name in value) input_value = value[name];
            input.value = input_value;
        } 
    }
    
    get value() {
        let value = {}
        for(let input of this.inputs){
            value[input.name] = input.value
            if (input.value.length == 0 && input.required)
                return null;
        }
        return value;
    }
}

SvgPlus.defineHTMLElement(MeetingScheduler);