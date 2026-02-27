import { DataComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { getUserInfo } from "../../../Firebase/user.js"
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"

useCSSStyle("meeting-display")
useCSSStyle("theme")

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
    }

    /**
     * Copies the meeting link to the clipboard
     * @return {Promise<void>}
     */
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

    /**
     * Copies the meeting invite HTML to the clipboard
     * @return {Promise<void>}
     */
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


    onvalue(value) {
        this.toggleAttribute("complete", value.status === "complete");
    }

    close() {
        this.parentNode.classList.remove('open')
    }

    async deleteMeeting(){
        this.toggleAttribute("loading", true);
        if (this.value) {
            try {
                if (!await this.value.delete()) {
                    throw "error"
                }
            } catch (e) {
                showNotification("Failed to delete session.", 5000, "error");
            }
        }
        this.close();
        this.toggleAttribute("loading", false);
    }

    edit(){
        this.close()
        document.querySelector("app-view").scheduleMeeting(this.value)
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
