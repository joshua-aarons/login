import {SvgPlus} from "./SvgPlus/4.js"
import { getHTMLTemplate, useCSSStyle } from "./template.js"

useCSSStyle("meeting-display")
useCSSStyle("theme")

class MeetingDisplay extends SvgPlus {
    onconnect() {
        this.innerHTML = getHTMLTemplate("meeting-display")
        let els = {}
        for (let el of this.querySelectorAll("[name]")){
            els[el.getAttribute("name")] = el;
        }
        this.els = els;
    }
    set value(value) {
        let _value = {}
        for (let key in value){
            if (key in this.els){
                this.els[key].innerHTML = value[key];
                _value[key] = value[key];
            }
        }
        this._value = _value
    }
    get value() {return this._value}
    resizeLink() {
        
    }
}

SvgPlus.defineHTMLElement(MeetingDisplay)
