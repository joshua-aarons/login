import {SvgPlus} from "../CustomComponent.js"
import { useCSSStyle } from "../template.js";

useCSSStyle("input-plus");
useCSSStyle("theme")
const DEFAULT_VALIDATERS = {
    email: (email) => {
        let expression = /^[^@]+@\w+(\.\w+)+\w$/
        if (expression.test(email) == true) {
          return true
        } else {
          throw "Invalid email"
        }
    },
    password: (password) => {
        if (password.length < 6) {
            throw "Password to short"
        } else {
            return true
        }
    }
}

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

        this.fileBox = this.createChild('div', {class: 'file-name'});
        this.fileBox.createChild('i', {class: 'fa-solid fa-file'});
        this.filename = this.fileBox.createChild('span');

        if (this.type == "password"){
            this.setAttribute("type", "password")
            let icon = this.createChild('i', {class: "icon fa-solid fa-eye-slash", styles: {"pointer-events": "all"}})
            let hidden = true
            icon.onclick = () => {
                hidden = !hidden
                input.setAttribute("type",hidden? "password":"text")
                icon.class = "icon fa-solid fa-eye" + (!hidden? "":"-slash")
            }
        } 
        if (this.type == "file") {
            this.onclick = () => {
                this.input.click()
            }
            this.fileBox.onclick = (e) => {
                this.value = "";
                this.showFile();
                e.stopPropagation();
            }
        }

        if (this.input.hasAttribute("value")) {
            this.value = this.input.getAttribute("value");
        }

    }

    showFile(){
        if(this.type == 'file' && this.input.files.length > 0){
            this.toggleAttribute('file', true)
            this.filename.innerHTML = this.value.name + " <i class='fa-solid fa-xmark'></i>"
            console.log(this.value)
        } else {
            this.toggleAttribute('file', false)
        }
    }

   

    get name(){
        let name = this.input.getAttribute("name");
        if (!name) name = this.getAttribute("name");
        return name
    }

    get type(){
        let t = this.getAttribute("type");
        if (t == 'password'){
            return t 
        } 
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
            if (this.input.files.length == 0) return null;
            else return this.input.files[0];
        }
        return this.input.value;
    }

    set value(value){
        if (value == "") {
            this.error = null
            this.classList.remove("not-empty"); 
        } else {
            this.classList.add("not-empty"); 
        }
        
        if (this.type === "datetime-local") {
            if (typeof value === "number") value = new Date(value);
            if (value instanceof Date) value = value.toISOString().slice(0,16);
        }
        this.input.value = value;
        this.showFile();
    }

    set error(error){
        this.toggleAttribute(`invalid`, typeof error == 'string');
        if (typeof error != 'string')
            error = ''
        this.errormessage.innerHTML = error
    }

    validate(){
        let message = "";
        let label = this.getAttribute("label"); 
        if (!label) {
            label = this.querySelector('label');
            if (label) {
                message = label.innerHTML.replace('*', '') + ' required';
            }
        } else {
            message = label + " required";
        }
        let valid = this.required ? (this.value != '' && this.value != null) : true;
        if (valid && (this.validater instanceof Function || this.type in DEFAULT_VALIDATERS)) {
            let validater = this.validater instanceof Function? this.validater: DEFAULT_VALIDATERS[this.type]
            try {
                valid = valid && validater(this.value);
            } catch (e) {
                valid = false;
                message = e;
                console.log(e);
            }
        }
        if (!valid) {
            this.error = message
        } else {
            this.error = null;
        }
        return valid
    }
}

class ProgressChart extends SvgPlus{
    onconnect(){
        if (!this.connected) {
            this.connected = true;
            this._percent = 0.75;
            this._offset = 0.25;
            let svg = this.createChild("svg",{viewBox: "-43 -43 86 86"})
            svg.createChild("circle",{r: 36})
            this.number = this.createChild("div",{class: "number"})
            this.progress = Math.random();
            if (this.wait_start) this.start();
        }
    }

    set progress(progress){
        let percent = Math.round(progress*100)
        this.number.innerHTML = percent + "%"
        this.percent = progress;
        this.offset = 0.25;
        this.stop();
    }

    set percent(percent) {
        this._percent = percent;
        this.style.setProperty("--percent",percent)
    }

    set offset(offset){
        this._offset = offset;
        this.style.setProperty("--offset",offset)
    }

    start(){
        console.log("starte", this.connected);
        if (!this.connected) {
            this.wait_start = true;
            return;
        }
        if (this.animating) return;
        this.animating = true;
        this.number.innerHTML = "";
        let stopped = false;
        let next = () => {
            if (!stopped) {
                let t = 0.5 + 0.5 * Math.cos(performance.now() / 1000);
                let theta1 =  t;
                let theta2 = (0.5 + 0.5 * Math.sin(performance.now() / 1222)) *0.9;
                this.offset = theta1;
                this.percent = (1 - theta1) *theta2;
                window.requestAnimationFrame(next);
            } else {
                this.animating = false;
            }
          }
          window.requestAnimationFrame(next);
          this.stop = () => {stopped = true;}
    }

    stop() {}
}

class OptionSlider extends SvgPlus {
    observers = new Map();
    onconnect() {
        if ( this.hasAttribute("toggle") ) {
            this.addEventListener("click", (e) => {
                if (this.selectedElement && this.selectedElement.nextElementSibling) {
                        this.selectedElement = this.selectedElement.nextElementSibling;
                } else {
                    this.selectedElement = this.querySelector("s-option:first-child");
                }

                this.dispatchEvent(new Event("change"));
            });
        } else {
            for (let option of this.querySelectorAll("s-option")) {
                option.addEventListener("click", (e) => {
                    this.selectedElement = option;
                    this.dispatchEvent(new Event("change"));
                });
            }
        }
       
        this.addObservers();
        this.selectedElement = this.querySelector("s-option[selected]");
    }

    _update() {
        if (!this.selectedElement) return;
        let size = this.observers.get(this.selectedElement).size;
        if (!size) return;
        let width = size.borderBoxSize[0].inlineSize;
        // let x = size.contentRect.x;
        this.style.setProperty("--slider-width", width + "px");

        let offset = this.selectedElement.offsetLeft;
        this.style.setProperty("--slider-position", offset + "px");
    }

    addObservers() {
        let elementsToWatch = [...this.querySelectorAll("s-option")]

        for (let el of elementsToWatch) {
            let obj = {};
            obj.resizeObserver = new ResizeObserver((entries) => {
                
                obj.size = entries[0];
                window.requestAnimationFrame(() => {
                    this._update();
                });
            });
            obj.resizeObserver.observe(el, {box: "border-box"});
            this.observers.set(el, obj);
        }
    }

    removeObservers() {
        for (let [el, obj] of this.observers.entries()) {
            if (obj.resizeObserver) {
                obj.resizeObserver.disconnect();
            }
        }
        this.observers.clear();
    }

    set selectedElement(element) {
        if (this.selectedElement) {
            this.selectedElement.removeAttribute("selected");
        }

        if (!(element instanceof HTMLElement)) {
            element = null;
        }

        this._selectedElement = element;
        if (element) {
            element.toggleAttribute("selected", true);
        } 
        this.toggleAttribute("no-selection", !element);
        this._update();
    }

    get selectedElement() {
        return this._selectedElement;
    }

    set value(value) {
        for (let option of this.querySelectorAll("s-option")) {
            if (option.getAttribute("value") == value || option.innerHTML == value) {
                this.selectedElement = option;
            }
        }
    }

    get value() {
        if (this.selectedElement) {
            return this.selectedElement.getAttribute("value") || this.selectedElement.innerHTML;
        }
        return null;
    }

}

SvgPlus.defineHTMLElement(OptionSlider);
SvgPlus.defineHTMLElement(InputPlus);
SvgPlus.defineHTMLElement(ProgressChart);