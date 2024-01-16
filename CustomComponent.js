import { SvgPlus, Vector } from "./SvgPlus/4.js";

class CustomComponent extends SvgPlus {
    getElementLibrary(){
        let els = {}
        for (let el of this.querySelectorAll("[name]")){
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

export {CustomComponent, Vector, SvgPlus, CustomForm}