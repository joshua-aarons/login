import { DataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { deleteSession } from "../../../Firebase/sessions.js"
import { getUserInfo } from "../../../Firebase/user.js"
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"

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


const TimeZones = {
    "(UTC+08:00) Perth": 8,
    "(UTC+09:30) Darwin": 9.5,
    "(UTC+10:00) Brisbane": 10,
    "(UTC+10:30) Adelaide": 10.5,
    "(UTC+11:00) Canberra, Melbourne, Sydney": 11,
    "(UTC+11:00) Hobart": 11,
    "(GMT+8:00) Perth": 8,
    "(GMT+9:30) Darwin": 9.5,
    "(GMT+10:00) Brisbane": 10,
    "(GMT+10:30) Adelaide": 10.5,
    "(GMT+11:00) Canberra, Melbourne, Sydney": 11,
    "(GMT+11:00) Hobart": 11
}

const LINK_FORMAT_TOKENS = {
    ":": "%3A",
    "/": "%2F",
    "?": "%3F"
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
      

        // on frame updates
        let next = () => {
            this.resizeLink();
            window.requestAnimationFrame(next);
        }
        window.requestAnimationFrame(next);
    }

   async copyLink() {
        if (this.value && this.value.link) {
            let link = this.value.link;
            let copyItems = new ClipboardItem({
                "text/plain": new Blob([link], {type: 'text/plain'})
            });
            try {
                await navigator.clipboard.write([copyItems])
                showNotification("Link copied to clipboard.", 3000, "success");
            } catch (err) {
                showNotification("Failed to copy link.", 5000, "success");
            }
        }
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

    async deleteMeeting(){
        this.toggleAttribute("loading", true);
        if (this.value && this.value.sid) {
            await deleteSession(this.value.sid);
        }
        this.close();
        this.toggleAttribute("loading", false);
    }

    edit(){
        this.close()
        document.querySelector("app-view").scheduleMeeting(this.value)
    }

    async copy(){
        let {displayName} = await getUserInfo();
        let {date, description, link, timezone} = this.value;
        let html = `<div><b>${displayName} has invited you to a Squidly session.</b></div>
        <div><b>Topic:</b> <span>${description}</span></div>
        <div><b>Date:</b> <span>${date} ${timezone}</span></div>
        <div><b>link:</b> <span>${link}</span></div>`
        let blob = new Blob([html], {type:'text/html'})
        let copyItems = new ClipboardItem({
            "text/html": blob
        }) 
        try {
            await navigator.clipboard.write([copyItems])
            showNotification("Session invite copied to clipboard.", 3000, "success");
        }  catch (err) {
            showNotification("Failed to copy session invite.", 5000, "error");
        }

    }

    addToGoogleCalender(){
        let {time, description, duration, link} = this.value;

        let start = new Date(time);
        start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
        let end = new Date(start.getTime() + duration * 60 * 1000);

        let f = (sd) => `${sd.getFullYear()}${(""+(sd.getMonth()+1)).padStart(2, 0)}${(""+(sd.getDate())).padStart(2, 0)}T${(""+sd.getHours()).padStart(2,0)}${(""+sd.getMinutes()).padStart(2,0)}00Z`;
        
        let linkf = link.replace(/:|\?|\//g, (a) => LINK_FORMAT_TOKENS[a]);
        let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${f(start)}%2F${f(end)}&location=${linkf}&text=${description.replace(" ", "%20")}`
        window.open(url);
    }

    addToOutlook(){
        let {time, description, duration, link} = this.value;

        let start = new Date(time);
        start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
        let end = new Date(start.getTime() + duration * 60 * 1000);

        let linkf = link.replace(/:|\?|\//g, (a) => LINK_FORMAT_TOKENS[a]);
        let f = (sd) => `${sd.getFullYear()}-${(""+(sd.getMonth()+1)).padStart(2, 0)}-${(""+(sd.getDate())).padStart(2, 0)}T${(""+sd.getHours()).padStart(2,0)}%3A${(""+sd.getMinutes()).padStart(2,0)}%3A00%2B00%3A00`;
        let url = `https://outlook.office.com/calendar/0/action/compose?allday=false&enddt=${f(end)}&location=${linkf}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${f(start)}&subject=${description}`
        window.open(url);
    }
}

SvgPlus.defineHTMLElement(MeetingDisplay)
