import { SvgPlus, Vector } from "./SvgPlus/4.js";
import { updateUserData, addListener } from "./dummy-data.js";
import { signout } from "./Firebase/firebase.js";

let DATA_COMPONENTS = [];

function isNested(el, root){
    let p = el.parentNode;
    let nested = false;
    while (!root.isSameNode(p)) {
        if (SvgPlus.is(p, CustomComponent)) {
            nested = true;
            break;
        } else {
            p = p.parentNode;
        }
    }
    return nested;
}
class CustomComponent extends SvgPlus {
    getElementLibrary() {
        let els = {}
        for (let el of this.querySelectorAll("[name]")) {
            if (!isNested(el, this)) {
                els[el.getAttribute("name")] = el;
            }
        }
        return els;
    }

    set active(active){
        this.classList.toggle("active", active);
        if (active && !this.active){
            if (this.onshow instanceof Function)
                this.onshow()
        } else if (!active && this.active) {
            if (this.onhide instanceof Function)
                this.onhide()
        }
        this._active = active
    }

    get active(){
        return this._active
    }

    attachEvents(events = ["onclick"]){
        for (let event of events) {
            let els = this.querySelectorAll(`[${event}]`);
            for (let el of els) {
                if (!isNested(el, this)) {
                    let value = el.getAttribute(event);
                    let match= value.match(/(\w+)(\(([^)]*)\))?/);
                    if (match) {
                        let fname = match[1];
                        let params = match[3];
                        if (this[fname] instanceof Function) {
                            el.removeAttribute(event);
                            el.onclick = () => this[fname]();
                        }
                    }
                }
            }
        }
    }
}

class CustomForm extends CustomComponent {
    set loading(value){
        if (!(this.loader instanceof HTMLElement)) {
            this.loader = this.createChild("div", {class: "loading-popup", content: `<progress-chart></progess-chart>`})
            this.lprog = this.loader.querySelector("progress-chart");
            this.lmessage = this.loader.createChild("div", {class: "message"})
        }

        if (value !== false && value !== null) {
            switch(typeof value) {
                case "number": 
                    this.lprog.progress = value; 
                    this.setAttribute("loading", "progress");
                    break;
                case "string": 
                    this.lmessage.innerHTML = value; 
                    this.setAttribute("loading", "message");
                    break;
                default:
                    this.lprog.start();
                    this.setAttribute("loading", "progress");
            }
        } else {
            this.removeAttribute("loading")
            this.lprog.stop();
        }
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

    get inputs() {
        return this.querySelectorAll("input-plus");
    }

    set value(value) {
        if (typeof value !== "object" || value == null) value = {}
        for (let input of this.inputs) {
            let name = input.name
            let input_value = "";
            if (name in value) input_value = value[name];
            input.value = input_value;
        }
        this.setvalue = value 
    }

    get value() {
        let value = {}
        for (let input of this.inputs) {
            value[input.name] = input.value
        }
        return value;
    }

    reset() {
        this.value = this.setvalue
    }

    validate() {
        let valid = true;
        for(let input of this.inputs){
            let isvalid = input.validate()
            valid = valid && isvalid
        }
        return valid
    }
}

class FormPlus extends CustomForm {
    onconnect(){
        let btns = this.querySelectorAll("button[name]");
        let buttons = {};
        for (let btn of btns) {
            let name = btn.getAttribute("name");
            buttons[name] = btn;
            btn.onclick = () => this.dispatchEvent(new Event(name));
        }
        this.buttons = buttons;
        this.attachEvents();
    }
}

class DataComponent extends CustomComponent {
    constructor(el) {
        super(el)
        this._value = {};
    }

    set value(value) {
        this._value = value

        if (!this.els)
            return

        if (this.onvalue instanceof Function)
            this.onvalue(value)

        for (let key in value) {
            if (key in this.els) {
                let el = this.els[key];
                let path = key.split(/\.|\//g);
                let sub = value;
                for (let p of path) sub = sub[p];
                let fieldtype = el.getAttribute('vfield')
                switch (fieldtype) {
                    case "innerHTML": el.innerHTML = sub;
                        break;
                    case "html": el.innerHTML = sub;
                        break;
                    case "src": el.setAttribute('src', sub);
                        break;
                    case "value": el.value = sub;
                        break;
                    default: el[fieldtype] = sub;
                        break;
                }
            }
        }
    }

    set template(template) {
        this.innerHTML = template
        this.els = this.getElementLibrary()
        this.attachEvents();
    }
}

class UserDataComponent extends DataComponent {
    afterconnect(){
        this.value = this._value
    }

    updateUserData(userData) {
        updateUserData(userData)
    }

    userLogout(){signout()}
}



SvgPlus.defineHTMLElement(FormPlus);


export { CustomComponent, Vector, SvgPlus, CustomForm, UserDataComponent, DataComponent }