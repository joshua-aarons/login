import { SvgPlus, Vector } from "./SvgPlus/4.js";
import { updateUserData } from "./dummy-data.js";
import { signout } from "./Firebase/firebase.js";

class CustomComponent extends SvgPlus {
    getElementLibrary() {
        let els = {}
        for (let el of this.querySelectorAll("[name]")) {
            let p = el.parentNode;
            let nested = false;
            while (!this.isSameNode(p)) {
                if (SvgPlus.is(p, CustomComponent)) {
                    nested = true;
                    break;
                } else {
                    p = p.parentNode;
                }
            }
            if (!nested) {
                els[el.getAttribute("name")] = el;
            }
        }
        return els;
    }
}

class CustomForm extends CustomComponent {
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
    }

    get value() {
        let value = {}
        for (let input of this.inputs) {
            value[input.name] = input.value
            if (input.value.length == 0 && input.required)
                return `the ${input.name} cannot be left blank`;
        }
        return value;
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

class UserDataComponent extends CustomComponent {
    constructor(el) {
        super(el)
        this._value = {}
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
                let fieldtype = el.getAttribute('vfield')
                switch (fieldtype) {
                    case "innerHTML": el.innerHTML = value[key];
                        break;
                    case "src": el.setAttribute('src', value[key]);
                        break;
                    case "value": el.setAttribute('value', value[key]);
                        break;
                    default: el[fieldtype] = value[key];
                        break;
                }
            }
        }
    }
    set template(template) {
        this.innerHTML = template
        this.els = this.getElementLibrary()
        this.value = this._value
    }

    updateUserData(userData) {
        updateUserData(userData)
    }

    userLogout(){signout()}
}

export { CustomComponent, Vector, SvgPlus, CustomForm, UserDataComponent }