import { DataComponent, SvgPlus } from "../../CustomComponent.js"
import { deleteSession } from "../../Firebase/firebase.js"
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
class MeetingDisplay extends DataComponent {
    
    onconnect() {
        this.template = getHTMLTemplate("meeting-display")
        let els = this.els;

        this.attachEvents();

        computeCharacterWidths(els.link);
        this.els = els;

        // this.value = {
        //     description: "description",
        //     "start-time": "today",
        //     duration:  60,
        //     "meeting-id": "xxxxxxxxxxxxxxx",
        //     "link": "app.squidly.com/Session/?xxxxxxxxxxxxxxx"
        // }

        // on frame updates
        let next = () => {
            this.resizeLink();
            window.requestAnimationFrame(next);
        }
        window.requestAnimationFrame(next);
    }
    resizeLink() {
        if (this.value && this.value.link) {
            let link = this.value.link;
            let linkShape = this.els["ss-link"];
            let widthShown = linkShape.children[1].clientWidth;
            let {linkWidth} = this;
            let linkText = cropToLength(link, widthShown-getStringLength("...---"));
            if (linkText != link) linkText += "..."
            
            this.els.link.innerHTML = linkText;
        }
    }
    close() {
        this.parentNode.classList.remove('open')
    }

    async delete(){
        if (this.value && this.value.sid) {
            await deleteSession(this.value.sid);
        }
        this.close();
    }

    edit(){
        this.close()
        document.querySelector("app-view").scheduleMeeting(this.value)
    }
}

SvgPlus.defineHTMLElement(MeetingDisplay)
