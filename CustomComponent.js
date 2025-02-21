import { SvgPlus, Vector } from "./SvgPlus/4.js";
import { setUserInfo, signout, updateDisplayPhoto } from "./Firebase/firebase.js";

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


    set disabled(bool){
        this.toggleAttribute("disabled", bool)
    }
    get inputs() {
        return this.querySelectorAll("input-plus");
    }

    set value(value) {
        if (this.onValue instanceof Function) value = this.onValue(value);
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
        for (let input of this.inputs)
            input.error = null
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
        let btns = this.querySelectorAll("button[name], .btn[name], .btn-text[name]");
        let buttons = {};
        for (let btn of btns) {
            let name = btn.getAttribute("name");
            buttons[name] = btn;
            btn.onclick = () => this.dispatchEvent(new Event(name, {bubbles: true}));
        }
        this.buttons = buttons;
        this.attachEvents();
    }
}

function flattern(obj) {
    let flat = {};
    let r = (n, s1, s2) => {
        if (n !== null && typeof n === "object") {
            for (let key in n) {
                r(n[key], s1 ? s1 + "/" + key : key, s2 ? s2 + "." + key : key);
            }
        }
        if (s1) {
            flat[s1] = n;
            flat[s2] = n;
        }
    }
    r(obj);
    return flat;
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

        let flat = flattern(value);
        for (let key in flat) {
            if (key in this.els) {
                let el = this.els[key];
                let fieldtype = el.getAttribute('vfield')
                let sub = flat[key];
                switch (fieldtype) {
                    case "innerHTML": el.innerHTML = sub;
                        break;
                    case "html": el.innerHTML = sub;
                        break;
                    case "src": el.setAttribute('src', sub);
                        break;
                    case "value": el.value = sub;
                        break;
                    case "background-image": 
                        el.style.setProperty("background-image", `url("${sub}")`);
                        break;
                    default: el[fieldtype] = sub;
                        break;
                }
            }
        }
    }

    get value(){return this._value;}

    set template(template) {
        this.innerHTML = template
        this.els = this.getElementLibrary()
        this.attachEvents();
    }
}

class UserDataComponent extends DataComponent {
    constructor(el){
        super(el);
        DATA_COMPONENTS.push(this)
    }
    afterconnect(){
        this.value = this._value
    }

    updateUserData(userData) {
        setUserInfo(userData)
    }

    userLogout(){signout()}

    updateDisplayPhoto(file, callback){
        updateDisplayPhoto(file, callback)
    }
}

function updateUserDataComponents(value) {
    for (let el of DATA_COMPONENTS) {
        el.value = value;
    }
}


SvgPlus.defineHTMLElement(FormPlus);


let LOADED_STYLES = {};

let isCSSConstructor = true;
let StylesPolyfilElement = null
try {
    let a = new CSSStyleSheet();
} catch (e) {
    isCSSConstructor = false;
    let styleDump = new SvgPlus("style-dump");
    styleDump.styles = {display: "none"};
    styleDump.attachShadow({mode: "open"});
    document.body.appendChild(styleDump);
    StylesPolyfilElement = styleDump;
}


async function newCSSStyleSheet(text) {
    console.log("create style");
    
    if (isCSSConstructor) {
        let style = new CSSStyleSheet()
        style.replaceSync(text);
        return style;
    } else {
        let styleSheetMaker = () => {
            let style = document.createElement("style")
            style.innerHTML = text;
            return style;
        }
        return styleSheetMaker;
    }
}


export class ShadowElement extends SvgPlus {
    constructor(el, name = el) {
        super(el);
        this.attachShadow({mode: "open"});
        this.loadStyles();
        let root = new SvgPlus(name);
        root.toggleAttribute("shadow");

        this._root = this.shadowRoot.appendChild(root);
    }

    appendChild(...args) {
        return this.root.appendChild(...args);
    }

    createChild(...args) {
        return this.root.createChild(...args);
    }

    async waitStyles(){
        if (this._stylesProm instanceof Promise) {
            await this._stylesProm
        }
    }

    async loadStyles(url = this.usedStyleSheets) {
        this._stylesProm = ShadowElement.loadStyleSheets(url);
        let styles = await this._stylesProm;

        if (isCSSConstructor) {
            this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, ...styles];
        } else {
            for (let s of styles) {
                this.shadowRoot.appendChild(s())
            }
        }
        return styles;
    }

    static async loadStyleSheets(url = this.usedStyleSheets){
        let styles = []
        if (typeof url === "string") url = [url];
        if (Array.isArray(url)) {
            let proms = url.map(async a => {
                if (!(a in LOADED_STYLES)) {
    
                    let prom = async () => {
                        try {
                            // console.log(`loading style from ${a}`);
                            
                            let res = await fetch(a);
                            let text = await res.text();
                            text = text.replaceAll(":root", "[shadow]")
                            let style = await newCSSStyleSheet(text)
                            // console.log(`loaded style from ${a}`);
                            
                            return style;
                        } catch (e) {
                            console.log(e);
                            return null;
                            
                        }
                    }
                    LOADED_STYLES[a] = prom();
                }
                return LOADED_STYLES[a]
            });
            styles = await Promise.all(proms);
        }

        return styles;
    }

    static get usedStyleSheets(){
        return []
    }

    get usedStyleSheets() {
        return this["__+"].usedStyleSheets
    }

    get root() {return this._root;}
}




export { updateUserDataComponents, CustomComponent, Vector, SvgPlus, CustomForm, UserDataComponent, DataComponent }