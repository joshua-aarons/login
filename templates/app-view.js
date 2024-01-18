import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import {} from "./MainPages/dash-board.js"
import {} from "./MainPages/data-and-privacy.js"
import {} from "./MainPages/meetings-panel.js"
import {} from "./MainPages/profile-panel.js"
import {} from "./MainPages/support-panel.js"
import {} from "./MainPages/admin-control.js"

import {} from "./MeetingTools/meeting-display.js"
import {} from "./MeetingTools/meeting-scheduler.js"
import {} from "./members-plus.js"
import { makeSessionKey } from "../Firebase/firebase.js"
import { CustomComponent, SvgPlus, UserDataComponent } from "../CustomComponent.js"


useCSSStyle("theme");
useCSSStyle("app-view");

export class AppView extends UserDataComponent {
    constructor(el = "app-view"){
        super(el)
        this.template = getHTMLTemplate("app-view");
        let els = this.els;
        let sideBar = els.sideBar;
        for (let child of sideBar.children) {
            child.addEventListener("click", () => {
                this.panel = child.getAttribute("type");
            })
        }
        this.panel = "dash-board"
    }
    set panel(type) {
        if (type == "logout") {
            this.userLogout();
        } else {
            for (let child of this.els.sideBar.children) {
                child.classList.toggle("active", child.getAttribute("type") == type);
            }
            for (let child of this.els.main.children) {
                child.classList.toggle("active", child.tagName.toLowerCase() == type);
            }
        }
    }
    onvalue(value) {
        this.els.profile.value = value
        this.els.dashboard.value = value
        this.els.privacy.value = value
    }

    themeToggle(){
        this.classList.toggle('dark-theme-variables');
    }

    scheduleMeeting(){
        console.log("xxx");
        this.els.meetingSchedulerPopup.classList.add("open")
    }

    async hostMeeting(){
        let key = await makeSessionKey();
        window.location = window.location.origin + `/Session/?${key}`;
    }


}

// SvgPlus.defineHTMLElement(AppView);