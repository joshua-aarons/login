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
        this.panel = "dash-board"
        // this.afterconnect()
    }
    set panel(type) {
        if (type == "logout") {
            this.userLogout();
        } else {
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
        let {sid} = await createSession({name: "Session Now"});
        window.open(window.location.origin + `/Session/?${key}`);
    }

    displayMeeting(meeting){
        this.els.meetingDisplayPopup.classList.add('open')
        this.els.meetingDisplay.value = meeting 
    }


}

// SvgPlus.defineHTMLElement(AppView);