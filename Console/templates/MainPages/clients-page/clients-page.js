import { DataComponent, SvgPlus, UserDataComponent } from "../../../../Utilities/CustomComponent.js";
import { useCSSStyle } from "../../../../Utilities/template.js";
import { ProfileSessionHistory } from "./profile-history.js";
import { ProfileList } from "./profile-list.js";
import { SettingsFrame } from "./settings-base.js";
import { SettingsPanel } from "./settings-panel.js";
import * as AllSettings from "./settings.js";

useCSSStyle("clients-page");

class ProfilePanel extends UserDataComponent {
    constructor() {
        super("div");
        this.els = {};
        this.class = "profile-panel";
        let h = this.createChild("div", {class: "main-head"});
        let header = h.createChild("div", {class: "row-space header"});
        this.headerText = header.createChild("h1", {content: "Profile"});
        this.buttons = header.createChild("div", {class: "button-row"});

        // Create toggle button
        this.toggleButton = h.createChild("div", {class: "toggle-button"});
        this.toggleIndicator = this.toggleButton.createChild("div", {class: "toggle-indicator"});
        this.settingsButton = this.toggleButton.createChild("span", {innerHTML: "Settings", events: {
            click: () => this.setToggleState("settings")
        }});
        this.sessionsButton = this.toggleButton.createChild("span", {innerHTML: "Session History", events: {
            click: () => this.setToggleState("sessions")
        }});

        // Main section        
        this.main = this.createChild("div", {class: "main"});
    }

    onvalue(data) {
        if (this.historyPanel && data) {
            this.historyPanel.logs = data?.sessionLogs?.[this.selctedProfileID] || {};
        }
    }

    setToggleState(state) {
        this.setAttribute("mode", state);
        this.toggleButton.setAttribute("toggle", state);
    }

    /**
     * @param {SettingsFrame} frame
     */
    set settings(frame) {

        // Dispose of any existing panels
        if (this.settingsPanel) {
            this.settingsPanel.dispose();
            this.settingsPanel = null;
        }
       
        if (this._changeListener) {
            this._changeListener();
            this._changeListener = null;
        }

        this.main.innerHTML = "";
        this.buttons.innerHTML = "";

        if (frame) {
            this.settingsPanel = this.main.createChild(SettingsPanel, {}, frame);
            if (frame.isDefault) {
                this.headerText.innerHTML = "Default Profile";
            } else {
                this._changeListener = frame.addChangeListener((path, value) => {
                    if (path === "profileSettings/name") {
                        this.headerText.innerHTML = value || "Untitled Profile";
                    }
                })

                this.buttons.createChild("button", {innerHTML: "Delete", events: {
                    click: () => frame.delete(),
                }, class: "btn"}).createChild("i", {class: "fa-solid fa-trash", style: {"margin-left": "0.5em"}})
           
            }

            const profileID = frame.id;
            this.selctedProfileID = profileID;
            this.historyPanel = this.main.createChild(ProfileSessionHistory, {name: "session-history"});
            this.value = this.value; // Trigger onvalue to load session logs for the selected profile
        }
    }

}


class ClientsPage extends DataComponent {
    onconnect() {
        if (!this.isBuilt) {
            let row = this.createChild("div");
            let profileListCard = row.createChild("div", {class: "profiles card"})
            let profilePanel = row.createChild(ProfilePanel)

            // Create profile list panel
            let profileListHeader = profileListCard.createChild("div", {class: "row-space"});
            profileListHeader.createChild("h1", {content: "Profiles"});
            profileListHeader.createChild("i", {
                class: "fa-solid fa-user-plus",
                events: {click: async () => {
                    const pid = await AllSettings.addSettingsFrame();
                    this.profilesList.selectProfile(pid);
                }},
            });
            this.profilesList = profileListCard.createChild(ProfileList, {events: {
                "profile-selected": (e) => {
                    console.log("Profile selected with ID:", e.detail);
                    const frame = AllSettings.getSettingsFrame(e.detail);
                    profilePanel.settings = frame;
                }
            }})
        
            AllSettings.onSettingsUpdate(this.onSettingsUpdate.bind(this));
            this.isBuilt = true;
        }
    }


    onSettingsUpdate() {
        this.profilesList.profiles = AllSettings.getAllSettingsFrames();
    }
}

SvgPlus.defineHTMLElement(ClientsPage);