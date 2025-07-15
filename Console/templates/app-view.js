import { getHTMLTemplate, useCSSStyle } from "../../Utilities/template.js"
import {} from "./MainPages/dash-board.js"
import {} from "./MainPages/data-and-privacy.js"
import {} from "./MainPages/meetings-panel.js"
import {} from "./MainPages/profile-panel.js"
import {} from "./MainPages/support-panel.js"
import {} from "./MainPages/admin-control.js"
import {} from "./MainPages/settings-panel.js"
import {} from "./MainPages/licences-page.js"
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
        this.template = getHTMLTemplate("app-view");
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
    }


    set panel(type) {
        const query = RouteQuery.parse(type, "dash-board");
        if (query.location == "logout") {
            this.userLogout();
        } else {
            for (let child of this.els.sideBar.children) {
                child.classList.toggle("active", child.getAttribute("type") == query.location);
            }
            for (let child of this.els.main.children) {
                if (child.tagName.toLowerCase() == query.location) {
                    child.active = true;
                    child.params = query.params;
                } else {
                    child.active = false;
                }
            }
            query.setLocation();
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

            if (!e.info.displayPhoto) {
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
        console.log(meeting);
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
        let session = await createSession("empty");
        window.open(window.location.origin + `/V3/?${session.sid}`);
    }

    displayMeeting(meeting){
        this.els.meetingDisplayPopup.classList.add('open')
        this.els.meetingDisplay.value = meeting 
    }

    updateBilling(){
        window.open(window.location.origin + `/Billing`);
    }


}
