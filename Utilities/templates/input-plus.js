import { SvgPlus } from "../CustomComponent.js";

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
    constructor(el = "option-slider") {
        super(el);
        
        this.childrenObserver = new MutationObserver(this._elements_changed.bind(this));
        this.childrenObserver.observe(this, {childList: true});
    }

    observers = new Map();
  
    _elements_changed() {
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

class OtpInput extends SvgPlus {
    constructor(el = "opt-input") {
        super(el);
        this.inputs = [];
    }

    set length(length) {
        length = parseInt(length);
        if (isNaN(length)) length = 6;
        let dir = 1;
        for (let i = this.inputs.length; i < length; i++) {
            let next = () => {
                let nextI = i + dir;
                if (nextI < 0) nextI = 0;
                if (nextI >= this.inputs.length) nextI = this.inputs.length - 1;
                this.inputs[nextI].focus();
                this.inputs[nextI].select();
            }
            let input = this.createChild("input", {
                name: "otp-" + (i+1),
                maxlength: 1,
                autocomplete: "off",
                events: {
                    paste: (e) => {
                        e.preventDefault();
                        let paste = (e.clipboardData || window.clipboardData).getData('text');
                        this.value = paste;
                        input.blur();
                    },
                    keydown: (e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.altKey) {                       
                            if (this.getAttribute("type") == "number" && e.key.length == 1 && !e.key.match(/[0-9]/)) {
                                e.preventDefault();
                            } else {
                                dir = (e.key == "Backspace" || e.key == "Delete" || e.key == "ArrowLeft") ? -1 : 1;
                                let isArrow = (e.key == "ArrowLeft" || e.key == "ArrowRight");
                                if ((input.value == "" && dir == -1) || isArrow) {
                                    next();
                                    e.preventDefault();
                                }
                            }
                        }
                    },
                    keyup: (e) => {
                        if (this.getAttribute("type") == "number" && e.key.length == 1 && !e.key.match(/[0-9]/)) {
                            e.preventDefault();
                        } else {
                           
                        }
                    },
                    input: (e) => {
                        next();
                    },
                    click: (e) => {
                        input.select();
                    }
                }
            })
            this.inputs.push(input);
        }
    }

    validate() {
        let valid = this.value.length == this.inputs.length;
        return valid;
    }

    get value() {
        return this.inputs.map(input => input.value).join("");
    }

    set value(value) {
        this.inputs.forEach((input, i) => {
            input.value = value[i] || "";
        });
    }

    static get observedAttributes() {
        return ["value", "length", "placeholder"];
    }
}

SvgPlus.defineHTMLElement(OptionSlider);
SvgPlus.defineHTMLElement(ProgressChart);
SvgPlus.defineHTMLElement(OtpInput);


class InputProxy extends SvgPlus {
    #required = false;
    getValue() {
        return this.input?.value ?? "";
    }

    setValue(value) {
        if (this.input) {
            this.input.value = value;
        }
        this._tempValue = value;
    }

    get value() {
        return this.getValue();
    }
    set value(val) {
        this.setValue(val);
    }

    validate() {
        return true;
    }
}

class CheckboxWrapper extends InputProxy {
    constructor() {
        super("label");
        this.class = "checkbox-wrapper";
        this.checkbox = this.createChild("input", {type: "checkbox"});
        this.slider = this.createChild("span", {class: "slider"});
    }

    set round(value) {
        this.toggleAttribute("round", value);
    }

     set locked(value) {
        this.toggleAttribute("locked", value);
    }


    get checked() {
        return this.checkbox.checked;
    }

    set checked(value) {
        this.checkbox.checked = !!value;
    }

    getValue() {
        return this.checked;
    }
    
    setValue(val) {
        this.checked = !!val;
    }
}

class FileInputWrapper extends InputProxy {
    constructor(content) {
        super("div");
        this.class = "file-input-wrapper error-container";

        this.fileInput = this.createChild("input", {type: "file", styles: {"display": "none"}});
        
        this.fileButton = this.createChild("div", {
            class: "btn file-button", 
            events: {
                click: () => {
                    this.fileInput.click();
                }
            }
        });
        this.buttonIcon = this.fileButton.createChild("div", {styles: {display: "contents"}});
        this.buttonText = this.fileButton.createChild("span", {content: content || "Choose File"});

        this.fileName = this.createChild("span", {class: "file-name", events: {
            click: (e) => {
                this.value = null;
                this.#updateFileName();
                e.stopPropagation();
            }
        }})

        this.fileInput.onchange = () => {
            this.#updateFileName();
            this.dispatchEvent(new Event("change"));
        }

        this.errorBox = this.createChild('div', {class: 'error-message'})
        this.errorBox.createChild('i', {class: 'fa-solid fa-circle-exclamation'})
        this.errormessage = this.errorBox.createChild('span')
    }

    set accept(value) {
        this.fileInput.setAttribute("accept", value);
    }

    set color(value) {
        this.fileButton.setAttribute("color", value);
    }

    set label(value) {
        this.buttonText.innerHTML = value;
    }
    get label() {
        return this.buttonText.innerHTML;
    }

    set icon(name) {
        this.buttonIcon.innerHTML = "";
        if (name.startsWith("fa")) {
            this.buttonIcon.createChild("i", {class: "icon " + name});
        } else {
            this.buttonIcon.createChild("span", {class: "icon material-symbols-outlined", content: name});
        }
    }

    #updateFileName() {
        const file = this.value;
        this.toggleAttribute("file", !!file);
        if (file) {
            this.fileName.createChild("i", {class: "fa-solid fa-file"});
            this.fileName.createChild("span", {content: file.name});
            this.fileName.createChild("i", {class: "fa-solid fa-xmark"});
        } else {
            this.fileName.innerHTML = "";
        }
    }

    getValue() {
        return this.fileInput.files[0] || null;
    }

    setValue(file) {
        if (file instanceof File) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            this.fileInput.files = dataTransfer.files;
        } else {
            this.fileInput.value = "";
        }
        this.#updateFileName();
    }

    validate() {
        if (this.required && !this.value) {
            let label = this["error-name"] || this.label || "File";
            this.error = label + " required.";
            return false;
        }
        return true;
    }

    set error(error){
        this.toggleAttribute(`invalid`, typeof error == 'string');
        if (typeof error != 'string')
            error = ''
        if (this.errormessage)        
            this.errormessage.innerHTML = error
    }
}

class TextInputWrapper extends InputProxy {
    constructor() {
        super("div");
        this.class = "text-input-wrapper error-container";
    }

    set name(value) {
        this._name = value;
        if (this.input) {
            this.input.name = value;
        }
    }

    get name() {
        return this._name;
    }

    set icon(name) {
        this._icon = name;
        if (this.iconContainer) {
            this.iconContainer.innerHTML = "";
            if (name.startsWith("fa")) {
                this.iconContainer.createChild("i", {class: "icon " + name});
            } else {
                this.iconContainer.createChild("span", {class: "icon material-symbols-outlined", content: name});
            }
        }
    }

    get icon() {
        return this._icon;
    }

    set autocomplete(value) {
        this.input.setAttribute("autocomplete", value);
    }

    set type(type) {
        this.build(type);
        if (type in typeInformation) {
            let info = typeInformation[type];
            if (info.validator) {
                this.validater = info.validator;
            }
        }
        this.setAttribute("type", type);
        this._type = type;
    }

    get type() {
        return this._type;
    }

    set label(value) {
        this._label = value;

        if (this.labelElement){
            this.labelElement.innerHTML = value;
        }
    }

    get label() {
        return this._label;
    }

    set min(value) {
        if (this.input) this.input.min = value;
    }

    set max(value) {
        if (this.input) this.input.max = value;
    }

     set step(value) {
        if (this.input) this.input.step = value;
    }

    build(type, element = type === "textarea" ? "textarea" : "input") {
        this.innerHTML = "";
        
        this.input = this.createChild(element, {
            class: "input-element",
            type: typeInformation[type]?.inputType || "text",
            value: this.value || "",
            events: {
                focus: () => {
                    this.classList.add("focus");
                    this.classList.add("not-empty");
                },
                blur: () => {
                    if(this.value == "") {
                        this.classList.remove("not-empty"); 
                    };
                    this.classList.remove("focus");
                },
                change: (e) => {
                    this.dispatchEvent(new Event(e));
                }
            }
        });
        if (this.name) this.name = this.name

        if (this._tempValue) {
            this.setValue(this._tempValue);
        }

        this.iconContainer = this.createChild("div", {styles: {display: "contents"}});
        if (this.icon) this.icon = this.icon; // trigger icon setter to create icon element

        this.labelElement = this.createChild("label", {class: "input-label"});
        if (this.label) this.label = this.label; // trigger label setter to set label text

        this.errorBox = this.createChild('div', {class: 'error-message'})
        this.errorBox.createChild('i', {class: 'fa-solid fa-circle-exclamation'})
        this.errormessage = this.errorBox.createChild('span')
    }

    set error(error){
        this.toggleAttribute(`invalid`, typeof error == 'string');
        if (typeof error != 'string')
            error = ''
        if (this.errormessage)        
            this.errormessage.innerHTML = error
    }

    setValue(value) {
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
        if (this.input) {
         this.input.value = value;
        }
        this._tempValue = value;
    }

    validate(){
        let label = this["error-name"] || this.label;
        let message = label + " required";
        let valid = this.required ? (this.value != '' && this.value != null) : true;

        if (valid && this.validater instanceof Function) {
            try {
                valid = this.validater(this.value);
            } catch (e) {
                valid = false;
                message = e;
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

class SelectWrapper extends TextInputWrapper {
    constructor() {
        super("select");
        this.classList.add("select-wrapper");
        
    }

    set type(value) {

    }
    set initialContent(content) {
        if (this.input) {
            this.input.innerHTML = content;

            this.value = this.input.value; // set initial value to first option
        } 
    }

    build(){
        super.build("select", "select");
    }

    addOption(value, content, otherAttributes = {}) {
        let option = this.input.createChild("option", {value, innerHTML: content, ...otherAttributes});
        return option;
    }
}

const typeInformation = {
    "text": {
        element: TextInputWrapper,
        inputType: "text",
    },
    "number": {
        element: TextInputWrapper,
        inputType: "number"
    },
    "password": {
        element: TextInputWrapper,
        inputType: "password",
        validator: (password) => {
            if (password.length < 6) {
                throw "Password to short"
            } else {
                return true
            }
        }
    },
    "datetime-local": {
        element: TextInputWrapper,
        inputType: "datetime-local"
    },
    "email": {
        element: TextInputWrapper,
        inputType: "email",
        validator: (email) => {
            let expression = /^[^@]+@\w+(\.\w+)+\w$/
            if (expression.test(email) == true) {
                return true
            } else {
                throw "Invalid email"
            }
        }
    },
    "url": {
        element: TextInputWrapper,
        inputType: "url"
    },
    "tel": {
        element: TextInputWrapper,
        inputType: "tel"
    },
    "search": {
        element: TextInputWrapper,
        inputType: "search"
    },
    "textarea": {
        element: TextInputWrapper
    },
    "select": {
        element: SelectWrapper,
    },
    "checkbox": {
        element: CheckboxWrapper,
        noValidation: true
    },
    "file": {
        element: FileInputWrapper,
        noValidation: true
    }
}

class InputPlus extends InputProxy {
    constructor(el) {
        super(el);
        this.#build();
    }

    get name() {
        return this._name;
    }

    set name(value) {   
        this._name = value;
        if (this.input) {
            this.input.name = value;
        }
    }

    #build() {
        let innerHTML = this.innerHTML.trim();
        this.innerHTML = "";
        
        this.name = this.getAttribute("name") || "";

        let type = this.getAttribute("type") || "text";
        let TypeInfo = typeInformation[type] || typeInformation["text"];
        let Element = TypeInfo.element;
        this.type = type;
        this.input = this.createChild(Element, {});

        this.validater = this.validater

        // get all set attributes and set them to the input element
        Array.from(this.attributes).forEach(attr => {
            if (attr.name === "style") return;
            let value = attr.value;
            this.input[attr.name] = value === "" ? true : value; // if attribute is empty string, set it to true (for boolean attributes)
        })

        this.input.initialContent = innerHTML;
    }

    set validater(validater) {
        if (validater instanceof Function) {
            if (this.input) {
                this.input.validater = validater;
            } 
            this._validater = validater;
        }
    }
    get validater() {
        return this._validater;
    }

    validate() {
        return this.input.validate();
    }

    static get observedAttributes() {
        return [
            "name",
            "type",
        ];
    }
}

SvgPlus.defineHTMLElement(InputPlus)


