import {SvgPlus, CustomForm, CustomComponent} from "../CustomComponent.js"
import { useCSSStyle } from "../template.js";

useCSSStyle("input-plus");
useCSSStyle("theme")

class FormPlus extends CustomForm {
    onconnect(){
        
    }
}

SvgPlus.defineHTMLElement(FormPlus);

class InputPlus extends SvgPlus {
    onconnect(){
        let {input} = this;
        input.addEventListener("focus", () => {
            this.classList.add("focus");
            this.classList.add("not-empty");
        });
        input.addEventListener("blur", () => {
            if(this.value == "") {
                this.classList.remove("not-empty"); 
            };
            this.classList.remove("focus");
        });
        input.addEventListener("change", (e) => {
            this.showFile()
            this.dispatchEvent(new Event(e));
        });
        this.errorBox = this.createChild('div', {class: 'error-message'})
        this.errorBox.createChild('i', {class: 'fa-solid fa-circle-exclamation'})
        this.errormessage = this.errorBox.createChild('span')

        this.fileBox = this.createChild('div', {class: 'file-name'})
        this.fileBox.createChild('i', {class: 'fa-solid fa-file'})
        this.filename = this.fileBox.createChild('span')

    }

    showFile(){
        if(this.type == 'file' && this.input.files.length > 0){
            this.toggleAttribute('file', true)
            this.filename.innerHTML = this.value.name
            console.log(this.value)
        } else {
            this.toggleAttribute('file', false)
        }
    }

    onclick(){
        if(this.type == "file")
            this.input.click()
    }

    get name(){
        let name = this.input.getAttribute("name");
        if (!name) name = this.getAttribute("name");
        return name
    }

    get type(){
        let type = this.input.getAttribute("type");
        if (!type) type = this.getAttribute("type");
        return type
    }

    get required(){
        let required = this.input.hasAttribute("required");
        if (!required) required = this.hasAttribute("required");
        return required
    }

    get input(){
        return this.querySelector("input, select, textarea");
    }

    get value(){
        if(this.type == 'file') {
            return this.input.files[0]
        }
        return this.input.value;
    }

    set value(value){
        this.input.value = value;
        if (value == "") {
            this.classList.remove("not-empty"); 
        } else {
            this.classList.add("not-empty"); 
        }
    }

    set error(error){
        this.toggleAttribute(`invalid`, typeof error == 'string');
        if (typeof error != 'string')
            error = ''
        this.errormessage.innerHTML = error
    }

    validate(){
        let valid = this.required? (this.value != '' || this.value instanceof File):true;
        if (!valid) {
            this.error = this.querySelector('label').innerHTML.replace('*', '') + ' required';
        } else {
            this.error = null;
        }
        return valid
    }
}

class ProgressChart extends SvgPlus{
    onconnect(){
        let svg = this.createChild("svg",{viewBox: "-43 -43 86 86"})
        svg.createChild("circle",{r: 36})
        this.number = this.createChild("div",{class: "number"})
        this.progress = Math.random()
    }
    set progress(progress){
        let percent = Math.round(progress*100)
        this.number.innerHTML = percent + "%"
        this.style.setProperty("--percent",progress)
    }
}

SvgPlus.defineHTMLElement(InputPlus);
SvgPlus.defineHTMLElement(ProgressChart);