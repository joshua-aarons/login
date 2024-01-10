import { CustomComponent, SvgPlus } from "../../CustomComponent.js"
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("meeting-display")
useCSSStyle("theme")

let charSizes = []
function computeCharacterWidths(ref){
    let style = window.getComputedStyle(ref);
    let els = [];
    for (let i = 0; i < 255; i++) {
        let text = new SvgPlus("div");
        text.innerHTML = String.fromCharCode(i);
        text.styles = {
            "font-family": style.fontFamily, 
            "font-size": style.fontSize, 
            "font-weight": style.fontWeight, 
            "display": "inline-block",
             position: "fixed", 
             "opacity": "0"
        };
        document.body.prepend(text);
        els.push(text);
    }
    
    window.requestAnimationFrame(() => {
        charSizes = []
        for (let el of els) {
            charSizes.push(el.bbox[1].x);
            el.remove();
        }
    })
}

function cropToLength(string, length) {
    let result = "";
    let l = 0;
    if (charSizes.length > 0) {
        for (let char of string) {
            let wchar = charSizes[char.charCodeAt(0)]
            if (l + wchar < length) {
                result += char;
                l += wchar;
            } else {
                break;
            }
        }
    }
    return result;
}

function getStringLength(string) {
    let l = 0;
    if (charSizes.length > 0) 
        for (let i = 0; i < string.length; i++) 
            l += charSizes[string.charCodeAt(i)];
    return l;
}



/**
 * @extends HTMLElement
 */
class MeetingDisplay extends CustomComponent {
    constructor(el){
        super(el);

        this._value = {
            description: "description",
            "start-time": "today",
            duration:  60,
            "meeting-id": "xxxxxxxxxxxxxxx",
            "link": "app.squidly.com/Session/?xxxxxxxxxxxxxxx"
        }
    }
    onconnect() {
        this.innerHTML = getHTMLTemplate("meeting-display")
        let els = this.getElementLibrary();
        computeCharacterWidths(els.link);
        this.els = els;

        // on frame updates
        let next = () => {
            this.resizeLink();
            window.requestAnimationFrame(next);
        }
        window.requestAnimationFrame(next);
    }

    /**
     * @param {Object} value
     */
    set value(value) {
        let _value = {}
        for (let key in value){
            if (key in this.els){
                this.els[key].innerHTML = value[key];
                _value[key] = value[key];
            }
        }
        this._value = _value;
    }
    get value() {return this._value}

    resizeLink() {
        if (this.value) {
            let link = this.value.link;
            let linkShape = this.els["ss-link"];
            let widthShown = linkShape.children[1].clientWidth;
            let {linkWidth} = this;
            let linkText = cropToLength(link, widthShown-getStringLength("...---"));
            if (linkText != link) linkText += "..."
            
            this.els.link.innerHTML = linkText;
        }
    }
}

SvgPlus.defineHTMLElement(MeetingDisplay)
