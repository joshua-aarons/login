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
import { CustomComponent, SvgPlus } from "../CustomComponent.js"


useCSSStyle("theme");
useCSSStyle("app-view");

export class AppView extends CustomComponent {
    constructor(el = "app-view"){
        super(el)
        this.innerHTML = getHTMLTemplate("app-view");
        let els = this.getElementLibrary();
        
        
        console.log(els);
        this.els = els;
        let sideBar = els.sideBar;
        for (let child of sideBar.children) {
            child.addEventListener("click", () => {
                this.panel = child.getAttribute("type");
            })
        }
    }


    set panel(type) {
        if (type == "logout") {

        }
        for (let child of this.els.sideBar.children) {
            child.classList.toggle("active", child.getAttribute("type") == type);
        }
        for (let child of this.els.main.children) {
            console.log(child.tagName);
            child.classList.toggle("active", child.tagName.toLowerCase() == type);
        }
    }
}

// SvgPlus.defineHTMLElement(AppView);