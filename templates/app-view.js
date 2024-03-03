import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import {} from "./MainPages/dash-board.js"
import {} from "./MainPages/data-and-privacy.js"
import {} from "./MainPages/meetings-panel.js"
import {} from "./MainPages/profile-panel.js"
import {} from "./MainPages/support-panel.js"
import {} from "./MainPages/admin-control.js"
import {} from "./hover.js"

import {} from "./MeetingTools/meeting-display.js"
import {} from "./MeetingTools/meeting-scheduler.js"
import { createSession } from "../Firebase/firebase.js"
import { CustomComponent, SvgPlus, UserDataComponent } from "../CustomComponent.js"

useCSSStyle("theme");
useCSSStyle("app-view");

function getURLPage(){
    let hash = window.location.hash.replace("#", "");
    if (hash.length == 0) hash = "dash-board";
    console.log(hash);
    return hash;
}
function setURLPage(name) {
    window.location = window.location.origin + (name == null ? "/#" : '/#' + name);
}


export class AppView extends UserDataComponent {
    constructor(el = "app-view"){
        super(el)
        this.template = getHTMLTemplate("app-view");
        this.dark = false;
        let els = this.els;
        let sideBar = els.sideBar;
        for (let child of sideBar.children) {
            child.addEventListener("click", () => {
                this.panel = child.getAttribute("type");
            })
        }
        this.panel = getURLPage();
        window.addEventListener("hashchange", (e) => {
            this.panel = getURLPage();
        })

        // this.afterconnect()
    }
    set panel(type) {
        if (type == "logout") {
            this.userLogout();
        } else {
            setURLPage(type)
            this._panel = type;
            for (let child of this.els.sideBar.children) {
                child.classList.toggle("active", child.getAttribute("type") == type);
            }
            for (let child of this.els.main.children) {
                child.active = child.tagName.toLowerCase() == type
            }
        }
    }
    get panel(){
        return this._panel;
    }

    onvalue(e) {
        if (e) {
            e.isAdmin = typeof e.admin === "string" ? "Admin" : "Staff"
            if (e.licence) {
                this.els.noLicencePopup.classList.toggle("open", e.licence.tier == "None");
                e.isAdmin = e.licence.tier == "None" ? "" : e.isAdmin;
            } 
            this.dark = e.info.dark === true;

            if (typeof e.admin !== "string" && this.panel == "admin-control") this.panel = "dash-board";
            this.toggleAttribute("admin", typeof e.admin === "string");

        }
    }

    set dark(bool) {
        this._dark = bool;
        this.classList.toggle('dark-theme-variables', bool);
    }
    get dark(){return this._dark;}

    themeToggle(){
        this.dark = !this.dark;
        this.updateUserData({dark: this.dark})
    }

    scheduleMeeting(meeting){
        if (meeting) {
            this.els.meetingScheduler.value = meeting;
        }
        console.log(meeting);
        this.els.meetingSchedulerPopup.classList.add("open")
    }

    async hostMeeting(){
        let time = new Date();
        time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
        time = time.getTime();

        let {sid} = await createSession({description: "My Meeting", time: time, timezone: "(UTC+11:00) Canberra, Melbourne, Sydney"});
        window.open(window.location.origin + `/Session/?${sid}`);
    }

    displayMeeting(meeting){
        this.els.meetingDisplayPopup.classList.add('open')
        this.els.meetingDisplay.value = meeting 
    }


}

// SvgPlus.defineHTMLElement(AppView);