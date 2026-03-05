import { SvgPlus, Vector } from "../../../../SvgPlus/4.js";
import { DataComponent, UserDataComponent } from "../../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../../Utilities/template.js";
import * as AllSettings from "./settings.js";

useCSSStyle("clients-page");

class ClientsPage extends DataComponent {
    onconnect() {
        this.template = getHTMLTemplate("clients-page");
    }
}

SvgPlus.defineHTMLElement(ClientsPage);

class ProfileSection extends UserDataComponent {
    constructor(el) {
      super(el);
    }

    onconnect() {
      this.els = {};
      this.allData = null;
      this.activeProfilePath = null;
    }

    onvalue(data) {
      if (!data) return;
      this.sessionLogs = data.sessionLogs;
      if (this.sessionsSection) {
          this.sessionsSection.setSessionLogs(this.sessionLogs, this.activeProfilePath);
      }
    }

    loadSettings(Settings, path) {
        this.activeProfilePath = path;
        this.innerHTML = "";
        let header = this.createChild("div", {class: "row-space header", style: {"margin-bottom": "0.5em"}});
        let name = header.createChild("h2", {innerHTML: Settings.getValue("profileSettings/name") || "Default Profile"});
    
        Settings.addChangeListener((path, value) => {
            if (path === "profileSettings/name") {
                name.innerHTML = value;
            }
        });

        let row = header.createChild("div", {class: "button-row"});
        row.createChild("button", {innerHTML: "Reset", events: {
            click: ()=> Settings.resetAllToDefault()}, 
            class: "btn"
        });

        if (!Settings.isDefault) {
            row.createChild("button", {innerHTML: "Delete", events: {
                click: () => {
                  Settings.delete();
                  this.innerHTML = "";
                }}, 
                class: "btn"
            });
        }
        
        this.settings = document.querySelector("#settings");
        this.toggleButton = this.createChild("div", {class: "toggle-button"});
        this.toggleIndicator = this.toggleButton.createChild("div", {class: "toggle-indicator"});
        this.settingsButton = this.toggleButton.createChild("span", {innerHTML: "Settings", events: {
            click: () => {
              this.setToggleState("settings");
            }
        }});
        this.sessionsButton = this.toggleButton.createChild("span", {innerHTML: "Session History", events: {
            click: () => {
              this.setToggleState("sessions");
            }
        }});
  
        this.settingsSection = this.createChild(SettingsSection, {name: "settings"}, Settings);
        this.sessionsSection = this.createChild(SessionsSection, {name: "session-history"}, path);
        this.sessionsSection.setSessionLogs(this.sessionLogs, path);
        this.setToggleState("settings");
    }

    setToggleState(mode) {
        if (mode === "settings") {
        //   this.settings?.style?.maxHeight = null;
        } else {
        //   this.settings?.style?.maxHeight = "calc(100vh - 3.8em)";
        }
        if (this.toggleButton) {
            this.toggleButton.setAttribute("toggle", mode);
        }
        if (this.settingsButton) {
            this.settingsButton.toggleAttribute("active", mode === "settings");
        }
        if (this.sessionsButton) {
            this.sessionsButton.toggleAttribute("active", mode === "sessions");
        }
        if (this.settingsSection) {
            this.settingsSection.toggleAttribute("hidden", mode === "sessions");
        }
        if (this.sessionsSection) {
            this.sessionsSection.toggleAttribute("hidden", mode === "settings");
        }
    }
}

SvgPlus.defineHTMLElement(ProfileSection);



/**
 * Error when deleting
 */