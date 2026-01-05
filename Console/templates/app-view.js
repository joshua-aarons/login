import { getHTMLTemplate, useCSSStyle } from "../../Utilities/template.js"
import {} from "./MainPages/dash-board.js"
import {} from "./MainPages/dashboard-welcome.js"
import {} from "./MainPages/calendar-page.js"
import {} from "./MainPages/data-and-privacy.js"
import {} from "./MainPages/meetings-panel.js"
import {} from "./MainPages/profile-panel.js"
import {} from "./MainPages/support-panel.js"
import {} from "./MainPages/admin-control.js"
import {} from "./MainPages/settings-panel.js"
import {} from "./MainPages/licences-page.js"
import {} from "./MainPages/feedback-page.js"
import {} from "../../Utilities/hover.js"

import {} from "./MeetingTools/meeting-display.js"
import {} from "./MeetingTools/meeting-scheduler.js"
import { UserDataComponent } from "../../Utilities/CustomComponent.js";

import {} from "../../Grids/grid-editor.js";
import {} from "../../Quizzes/quiz-editor.js";
import { createSession } from "../../Firebase/sessions.js"
import { onLocationChange, RouteQuery } from "../../Utilities/router.js"


useCSSStyle("theme");
useCSSStyle("app-view");


export class AppView extends UserDataComponent {
    constructor(el = "app-view"){
        super(el)
        
        // Expose to window for global access IMMEDIATELY
        window.appView = this;
        
        this.template = getHTMLTemplate("app-view");
        
        // Ensure window.appView is set after template is loaded
        window.appView = this;
        
        this.dark = false;
        
        let els = this.els;
        let sideBar = els.sideBar;
        for (let child of sideBar.children) {
            child.addEventListener("click", () => {
                this.panel = child.getAttribute("type");
            })
        }
        this.panel = RouteQuery.fromWindow("dash-board");
        onLocationChange((location) => {
            this.panel = location;
        }, "dash-board");
        
        // Final check - ensure window.appView is set
        window.appView = this;
    }
    
    onconnect() {
        // Ensure window.appView is set when component connects
        window.appView = this;
    }


    set panel(type) {
        const query = RouteQuery.parse(type, "dash-board");
        
        if (query.location == "logout") {
            this.userLogout();
        } else {
            // Update sidebar active state
            let foundSidebarMatch = false;
            for (let child of this.els.sideBar.children) {
                const childType = child.getAttribute("type");
                const isActive = childType == query.location;
                child.classList.toggle("active", isActive);
                if (isActive) {
                    foundSidebarMatch = true;
                }
            }
            
            // If no sidebar match found, activate the first sidebar item (dash-board)
            if (!foundSidebarMatch && this.els.sideBar.children.length > 0) {
                const firstSidebarItem = this.els.sideBar.children[0];
                firstSidebarItem.classList.add("active");
                // Update query location to match first sidebar item
                query.location = firstSidebarItem.getAttribute("type") || "dash-board";
            }
            
            // Update main content panels
            for (let child of this.els.main.children) {
                const tagName = child.tagName.toLowerCase();
                const nameAttr = child.getAttribute("name");
                const matches = tagName == query.location || nameAttr == query.location;
                
                if (matches) {
                    child.active = true;
                    child.params = query.params;
                } else {
                    child.active = false;
                }
            }
            
            query.setLocation();
            this._panel = query.location;
        } 
    }

    get panel(){
        return this._panel;
    }

    onvalue(e) {
        if (e) {
            console.log("All Data: %O ", e);
            
            const {isAdmin} = e;
            this.dark = e?.info?.dark === true;
            if (!isAdmin && this.panel == "admin-control") this.panel = "dash-board";
            this.toggleAttribute("admin", isAdmin);

            if (!e?.info?.displayPhoto) {
                this.els["info/displayPhoto"].style = {
                    "background-image": null,
                }
            }
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
        this.els.meetingSchedulerPopup.classList.add("open")
    }

    openGridEditor(){
        this.els.gridEditorPopup.classList.add("open")
    }
    closeGridEditor(){
        this.els.gridEditorPopup.classList.remove("open")
    }
    openQuizEditor(){
        this.els.quizEditorPopup.classList.add("open")

    }
    closeQuizEditor(){
        this.els.quizEditorPopup.classList.remove("open")
    }

    async hostMeeting(){
        try {
            let session = await createSession("empty");
            window.open(window.location.origin + `/V3/?${session.sid}`);
        } catch (e) {
            console.warn("Failed to create session: ", e);
            window.showNotification("You will need a licence to host meetings.", 5000, "error");
        }
    }

    displayMeeting(meeting){
        this.els.meetingDisplayPopup.classList.add('open')
        this.els.meetingDisplay.value = meeting 
    }

    updateBilling(){
        window.open(window.location.origin + `/Billing`);
    }


}
