import { set } from "../../../Firebase/firebase-client.js";
import { SvgPlus, Vector } from "../../../SvgPlus/4.js";
import { DataComponent, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import * as AllSettings from "./settings.js";

useCSSStyle("clients-page");

class ClientsPage extends DataComponent {
    onconnect() {
        this.template = getHTMLTemplate("clients-page");
    }
}

SvgPlus.defineHTMLElement(ClientsPage);

class NumberInput extends SvgPlus {
    constructor(option) {
        super("input");
        this.type = "number";

        this.addEventListener("change", () => {
            this.value = this.parse(this.value);
        });
        this.dp = (option.step+"").split(".")[1]?.length || 0
        this.option = option;
    }

    parse(value) {
        const {option, dp} = this;
        let val = parseFloat(value);
        if (Number.isNaN(val)) {
            val = option.default;
        } else {
            if (option.min !== undefined) {
                val = Math.max(option.min, val);
                
            }
            if (option.max !== undefined) {
                val = Math.min(option.max, val);
            }

            if (option.step !== undefined) {
                val = Math.round(val / option.step) * option.step;
                val = val.toFixed(dp);
            }
        }
        
        return val;
    }
}

class Selection extends SvgPlus {
    constructor({path, options}, settings) {
        super("div");
        this.class = "select-wrapper";
        this.select = this.createChild("select", {class: "select-input"});
        
        if (options instanceof Function) {
            settings.addChangeListener(() => {
                this.update(settings.getSelection(path));
            })
        }
        this.update(settings.getSelection(path));
    }
    update(newOptions) {
        let oldValue = this.select.value;
        this.select.innerHTML = "";
        let isOldValueValid = false;
        let firstValue = null;
        for (let {value, displayValue} of newOptions.reverse()) {
            this.select.createChild("option", {value: value, innerHTML: displayValue});
            if (value === oldValue) {
                isOldValueValid = true;
            }
            if (firstValue === null) {
                firstValue = value;
            }
        }
        if (!isOldValueValid) {
            this.value = firstValue;
            this.dispatchEvent(new Event("change"));
        } else {
            this.value = oldValue;
        }
    }
    get value() {
        return this.select.value;
    }
    set value(v) {
        this.select.value = v;  
    }
}

class UploadIcon extends SvgPlus {
    constructor() {
        super("svg");
        this.props = {
            viewBox: "0 0 50 50",
            xmlns: "http://www.w3.org/2000/svg",
            class: "upload-icon-svg"
        }
        this.innerHTML = `<path class = "main-graphic" d="M25,3C12.85,3,3,12.85,3,25s9.85,22,22,22,22-9.85,22-22S37.15,3,25,3ZM24.69,9.93l4.99,8.9h-3.06v9.34h-4.13v-9.34h-3.53l5.73-8.9ZM36.91,27.94c0,4.14-3.37,7.5-7.5,7.5h-9.71c-4.14,0-7.5-3.37-7.5-7.5v-7.35h4.13v7.35c0,1.86,1.51,3.37,3.37,3.37h9.71c1.86,0,3.37-1.51,3.37-3.37v-7.35h4.13v7.35Z"/>`
        this.progressCircle = this.createChild("path", {class: "progress-circle"});
        this.progress = 0;
    }

    set progress(num) {

        const radius = 22;
        if (num > 1) num = 1;
        if (num < 0) num = 0;
        let angle = Math.PI * 2 * (1 - num)
        let p1 = new Vector(0, radius);
        let p2 = p1.rotate(angle);

        let rv = new Vector(radius);
       
        let dpath = ""
        if (num > 0 && num < 1) {
          dpath = `M25,25m${p1}a${rv},1,${angle > Math.PI ? 0 : 1},0,${p2.sub(p1)}`;
        } else if (num == 1) {
          dpath = `M25,25m0,${radius}a${rv},0,0,0,0,-${2*radius}a${rv},0,0,0,0,${2*radius}`
        }else {
          dpath = "";
        }
        this.progressCircle.props = {
            d: dpath,
            "stroke-width": 6,
            fill: "none",
            "stroke": "#3fff00"
        }
        this._progress = num;
    }
    get progress() {
        return this._progress;
    }

}
   
class FileUploader extends SvgPlus {
    constructor(option, setting) {
        super("div");
        this.class = "btn file-uploader";
        this.createChild("span", {innerHTML: "Upload Image"});
        this.icon = this.createChild(UploadIcon);
        this.setting = setting;
        this.option = option;
        this.addEventListener("click", () => {
            this.upload();
        });
    }

    async _uploadToStorage(file) {
        this.icon.progress = 0;
        this.toggleAttribute("uploading", true);
        let url = await this.setting.dataFrame.uploadFile(file, this.option.path, (status) => {
            let progress = Math.floor(status.bytesTransferred / status.totalBytes * 100);
            this.styles = { "--progress": `${progress}` }
            this.icon.progress = status.bytesTransferred / status.totalBytes;
        });
        this._value = url;
        this.dispatchEvent(new Event("change"));
        this.toggleAttribute("uploading", false);
    }

    upload() {
        let fileInput = new SvgPlus("input");
        fileInput.type = "file";
        fileInput.accept = this.option.fileType || "*/*";
        fileInput.addEventListener("change", () => {
            let file = fileInput.files[0];
            if (file) {
                if (this.option.maxSize && file.size > this.option.maxSize) {
                    alert(`File size exceeds the maximum size of ${this.option.maxSize / (1024 * 1024)} MB.`);
                } else {
                    this._uploadToStorage(file);
                }
            }
        });
        fileInput.click();
    }

    get value() {
        return this._value
    }

    set value(v) {
        this.icon.progress = typeof v === "string" && v !== "" ? 1 : 0;
        this._value = v;
    }
}

class SettingOptionInput extends SvgPlus {
    constructor(option, name, settings) {
        super("div");
        this.class = "setting-option-input";
        let settingName = settings.getName(option.path)
        if (option.path.split("/")[0] === "calibration") {
          settingName = "Calibration " + settingName.charAt(0).toUpperCase() + settingName.slice(1);
        } else {
          settingName = settingName.charAt(0).toUpperCase() + settingName.slice(1);
        }

        this.createChild("span", {innerHTML: settingName});

        switch(option.type) {
            case "boolean":
                const props = option.path === "eye-gaze-enabled" ? {for: settingName, class: "switch"} : {for: settingName};
                const spanClass = option.path === "eye-gaze-enabled" ? {class: "slider round"} : {class: "checkmark"};
                let label = this.createChild("label", props);
                this.input = label.createChild("input", {type: "checkbox", id: settingName});
                label.createChild("span", spanClass);
                break;
            case "number":
                this.input = this.createChild(NumberInput, {}, option);
                break;
            case "string":
                this.input = this.createChild("input", {type: "text"});
                break;
            case "option":
                this.input = this.createChild(Selection, {}, option, settings);
                break;

            case "file":
                this.input = this.createChild(FileUploader, {}, option, settings);
                break;
        }

        this.option = option;

        this.value = settings.getValue(option.path) || option.default;

        this.input.addEventListener("change", () => {
            settings.setValue(option.path, this.value);
        });

        this._removeListener = settings.addChangeListener((path, newValue) => {
            if (path === option.path) {
                this.value = newValue;
            }
        })
    }

    get value() {
        if (this.option.type === "boolean") {
            return this.input.checked;
        } else if (this.option.type === "number") {
            return parseFloat(this.input.value);
        } else {
            return this.input.value;
        }
    }

    set value(value) {
        if (this.option.type === "boolean") {
            this.input.checked = value;
        } else if (this.option.type === "number") {
            this.input.value = this.input.parse(value);
        } else {
            this.input.value = value;   
        }
    }
}

class SettingsTab extends SvgPlus {
    constructor(icon, category, sections) {
      super("div");
      this.createChild("div", {class: "material-symbols-outlined icon", innerHTML: icon});
      let description = category.replace(/([a-z])([A-Z])/g, '$1 $2');
      description = description.charAt(0).toUpperCase() + description.slice(1);
      this.setAttribute("title", description);
      this.sections = sections;
      this.category = category;
      this.addEventListener("click", this.onTabClicked);
      if (this.category === "display") {
          this.sections[this.category].toggleAttribute("hidden");
          this.toggleAttribute("active");
      }
    }

    onTabClicked() {
      for (let key in this.sections) {
        let section = this.sections[key];
        section.hidden = true;
      }
      this.sections[this.category].toggleAttribute("hidden");
      document.querySelectorAll(".tab").forEach((tab) => {
        if (tab.getAttribute("active") !== null) {
          tab.toggleAttribute("active");
        }
      })
      this.toggleAttribute("active");
    }
}

class SettingsSection extends SvgPlus {
  constructor(Settings) {
    super("div");
    this.icons = {
        display: "desktop_windows",
        access: "accessibility_new",
        keyboardShortcuts: "keyboard",
        languages: "language",
        cursors: "arrow_selector_tool"
    }

    this.settingsContainer = this.createChild("div", {class: "settings-container"});
    let settingsHeader = this.settingsContainer.createChild("div", {class: "settings-header"});
    settingsHeader.createChild("i", {class: "fa-solid fa-gear"});
    settingsHeader.createChild("span", {innerHTML: "Settings"});

    let content = this.settingsContainer.createChild("div", {class: "settings-content"});
    this.tabsContainer = content.createChild("div", {class: "tabs-container"});
    this.settingsOptions = content.createChild("div", {class: "settings-options"});

    let settingsDescriptor = Settings.settingsAsObject;
    const newSettingsDescriptor = {
        ...(settingsDescriptor["profileSettings"] && !Settings.isDefault 
            ? { display: { ...settingsDescriptor["profileSettings"], ...settingsDescriptor["display"] }}
            : { display: { ...settingsDescriptor["display"] }}
        ),
        access: { ...settingsDescriptor["access"], "Eye-gaze enabled": settingsDescriptor["eye-gaze-enabled"], ...settingsDescriptor["volume"], ...settingsDescriptor["calibration"]
        },
        keyboardShortcuts: { ...settingsDescriptor["keyboardShortcuts"] },
        languages: { ...settingsDescriptor["languages"] },
        cursors: { ...settingsDescriptor["cursors"] }
    };
    
    this.sections = {}
    for (let category in newSettingsDescriptor) {
      let section = this.settingsOptions.createChild("section", {name: category, hidden: true});
      for (let key in newSettingsDescriptor[category]) {
          let value = newSettingsDescriptor[category][key];
          section.createChild(SettingOptionInput, {}, value, key, Settings);
      }
      this.sections[category] = section;
      this.tabsContainer.createChild(SettingsTab, {class: "tab"}, this.icons[category], category, this.sections)
    }

    this.sizeObserver = new ResizeObserver(() => {
        Object.values(this.sections).forEach(section => {
          let hasBorder = this.settingsOptions.clientHeight === Math.round(section.getBoundingClientRect().height);
          if (section.hasAttribute("border") !== hasBorder) {
            section.toggleAttribute("border", hasBorder); 
          }
        });
    })
    this.sizeObserver.observe(this.settingsOptions);
  }
}

class SessionsSection extends SvgPlus {
  constructor(path) {
    super("div");
    this.class = "sessions-section";
    this.path = path; 
    this.sessions = new Set();
  }

  setSessionLogs(sessionLogs, path = this.path) {
    if (sessionLogs) {
      const profile = path.split("/").at(-1);
      const profileSessionLogs = sessionLogs[profile];
      Object.keys(profileSessionLogs).forEach((session) => {
        if (!this.sessions.has(session)) {
          this.createChild(SessionCard, {}, sessionLogs[profile][session])
        }
        this.sessions.add(session);
      })
    }
  }
}

class SessionCard extends SvgPlus {
  constructor(sessionData) {
    super("div");
    this.class = "session-card";
    this.optionToText = {
      "colour-1": "Black/White",
      "colour-2": "White/Black",
      "colour-3": "Black/Yellow",
      "colour-4": "Black/Green",
      "colour-5": "Blue/Yellow",
    };

    const d = new Date(sessionData.metadata.time);
    let date = d.toLocaleDateString(undefined, {month: "short", day: "2-digit", year: "numeric"});
    let time = d.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit", hour12: true});

    // Session header
    this.session = this.createChild("div", {class: "session"})
    this.sessionInfo = this.session.createChild("div", {class: "session-info"});
    this.sessionInfo.createChild("span", {class: "session-date", innerHTML: date});
    let timeInfo = this.sessionInfo.createChild("div", {class: "session-time"});
    timeInfo.createChild("i", {class: "fa-regular fa-clock", style: {"margin-right": "0.25em"}})
    timeInfo.createChild("span", {innerHTML: time});

    this.container = this.session.createChild("div", {class: "session-container"});
    this.container.createChild("span", {innerHTML: sessionData.metadata.duration + " min"});
    this.arrow = this.container.createChild("span", {name: "arrow", innerHTML: "▾", style: {"font-size": "1.6em", "margin-left": "auto"}});

    // Expandable section
    this.panel = this.createChild("div", {class: "panel"});
    this.session.addEventListener("click", () => this.onPanelClicked());

    // Calibration
    const calibrationSection = this.panel.createChild("div", {class: "section"});
    calibrationSection.createChild("div", {class: "section-label", innerHTML: "EYE GAZE SCORES"});
    let calibrationContent = calibrationSection.createChild("div", {class: "section-content"});
    if (!sessionData.calibrationScores || sessionData.calibrationScores.length === 0) {
      calibrationContent.createChild("span", {innerHTML: "-"})
    } else {
      sessionData.calibrationScores.forEach((score, i) => {
        let row = calibrationContent.createChild("div", {class: "row-data"});
        row.createChild("span", {innerHTML: `Calibration ${i + 1}`});
        row.createChild("span", {innerHTML: `${score}%`, style: {"font-weight": 600}});
      });
    }

    // Settings changes
    const settingsSection = this.panel.createChild("div", {class: "section"});
    settingsSection.createChild("div", {class: "section-label", innerHTML: "SETTINGS"});
    let settingsContent = settingsSection.createChild("div", {class: "section-content"});
    console.log(sessionData.settings)
    if (!sessionData.settings || Object.keys(sessionData.settings).length === 0) {
      settingsContent.createChild("span", {innerHTML: "-"})
    } else {
      let hasChanges = false;
      for (const [settingPath, setting] of sessionData.settings) {
        if (setting.oldValue === setting.newValue) continue;
        hasChanges = true;
        let row = settingsContent.createChild("div", {class: "row-data"});
        const displaySetting = settingPath.replace(/^(participant|host)\//, "");
        row.createChild("span", {innerHTML: `${displaySetting.charAt(0).toUpperCase() + displaySetting.slice(1)}`});
        let settingDiv = row.createChild("div");
        let oldValue = typeof setting.oldValue  === "number" ? Math.round(setting.oldValue * 10) / 10 : setting.oldValue;
        let newValue = typeof setting.newValue  === "number" ? Math.round(setting.newValue * 10) / 10 : setting.newValue;
        if (this.optionToText[oldValue] || this.optionToText[newValue]) {
          oldValue = this.optionToText[oldValue];
          newValue = this.optionToText[newValue];
        }
        settingDiv.createChild("span", {innerHTML: `${oldValue} → `, style: {"color": "#b3b7c0"}});
        settingDiv.createChild("span", {innerHTML: `${newValue}`, style: {"font-weight": 600}});
      };
      if (!hasChanges) {
        settingsContent.createChild("span", {innerHTML: "-"});
      }
    }

    // Access methods
    const accessSection = this.panel.createChild("div", {class: "section"});
    accessSection.createChild("div", {class: "section-label", innerHTML: "ACCESS"});
    let accessContent = accessSection.createChild("div", {class: "section-content-wrap"});
    let accessUsed = false;
    Object.keys(sessionData.access).forEach((method) => {
      if (sessionData.access[method]) {
        accessUsed = true;
        accessContent.createChild("div", {
          class: "data-div",
          style: {color: "#7380ec", "background-color": "#eef2ff", border: "1px solid #d8e3ff"},
          innerHTML: method.charAt(0).toUpperCase() + method.slice(1)
        });
      }
    })
    if (!accessUsed) {
      accessContent.createChild("span", {innerHTML: "-"});
    }

    // AAC 
    const aacSection = this.panel.createChild("div", {class: "section"});
    aacSection.createChild("div", {class: "section-label", innerHTML: "AAC"});
    let hostStyles = {color: "#2e9e5b", "background-color": "#f0faf4", border: "1px solid #c5e8d4"};
    let participantStyles = {color: "#7380ec", "background-color": "#eef2ff", border: "1px solid #d8e3ff"};
    let aacContent = aacSection.createChild("div", {class: "section-content-wrap"});
    if (!sessionData.aac || sessionData.aac.length === 0) {
      aacContent.createChild("span", {innerHTML: "-"})
    } else {
      sessionData.aac.forEach((aac) => {
        let [word, isHost] = aac;
        aacContent.createChild("div", {
          class: "data-div",
          style: isHost ? hostStyles : participantStyles,
          innerHTML: word
        })
      })
    }

    if (sessionData.aac) {
      let legend = aacSection.createChild("div", {class: "aac-legend"});

      let hostLegend = legend.createChild("div", {class: "aac-legend-item"});
      hostLegend.createChild("div", {class: "aac-legend-box", style: hostStyles});
      hostLegend.createChild("span", {innerHTML: "Host"});

      let participantLegend = legend.createChild("div", {class: "aac-legend-item"});
      participantLegend.createChild("div", {class: "aac-legend-box", style: participantStyles});
      participantLegend.createChild("span", {innerHTML: "Participant"});
    }

    // Apps 
    const appsSection = this.panel.createChild("div", {class: "section"});
    appsSection.createChild("div", {class: "section-label", innerHTML: "APPS"});
    let appsContent = appsSection.createChild("div", {class: "section-content"});
    if (!sessionData.apps || Object.keys(sessionData.apps).length === 0) {
      appsContent.createChild("span", {innerHTML: "-"})
    } else {
      for (const [app, duration] of sessionData.apps) {
        let row = appsContent.createChild("div", {class: "row-data"});
        row.createChild("span", {innerHTML: app});
        row.createChild("span", {innerHTML: `${duration} min`, style: {"font-weight": 600}})
      }
    }


    // Quizzess 
    const quizzesSection = this.panel.createChild("div", {class: "section"});
    quizzesSection.createChild("div", {class: "section-label", innerHTML: "QUIZZES"});
    let quizzesContent = quizzesSection.createChild("div", {class: "section-content"});
    if (!sessionData.quizzes || Object.keys(sessionData.quizzes).length === 0) {
      quizzesContent.createChild("span", {innerHTML: "-"})
    } else {
      for (const [quiz, duration] of sessionData.quizzes) {
        let row = quizzesContent.createChild("div", {class: "row-data"});
        row.createChild("span", {innerHTML: quiz});
        row.createChild("span", {innerHTML: `${duration} min`, style: {"font-weight": 600}})
      }
    }
  }

  onPanelClicked() {
      const isOpen = this.panel.style.maxHeight && this.panel.style.maxHeight !== "0px";
      this.toggleAttribute("open", !isOpen);
      this.arrow.toggleAttribute("active", !isOpen)
      if (isOpen) {
        this.panel.style.maxHeight = "0px";
      } else {
        this.panel.style.maxHeight = this.panel.scrollHeight + "px";
      }
  };
}

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
      console.log(data)
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
          this.settings.style.maxHeight = null;
        } else {
          this.settings.style.maxHeight = "calc(100vh - 3.8em)";
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

class BGImg extends SvgPlus {
    constructor(src) {
        super("div");
        this.class = "img";
        this.src = src;
    }

    set src(v) {
        if (typeof v === "string" && v !== "") {
            this.style.backgroundImage = `url('${v}')`;
            this.style.backgroundColor = "transparent";
        } else {
            this.style.backgroundImage = null;
            this.style.backgroundColor = "#eaeaf1"
        }
    }
}

class ProfileCard extends SvgPlus {
    constructor(Settings, path) {
        super("div");
        this.class = "profile-card";
        const header = this.createChild("div", {class: "profile-header"});
        this.profileImage = header.createChild(BGImg, {}, Settings.getValue("profileSettings/image"));
        this.profileName = header.createChild("span", {innerHTML: Settings.getValue("profileSettings/name") || "Default Profile"});

        Settings.addChangeListener((path, value) => {
            if (path === "profileSettings/name") {
                this.profileName.innerHTML = value;
            } else if (path === "profileSettings/image") {
                this.profileImage.src = value;
            }
        });
        this.Settings = Settings;
    }

    dispose() {
        this.Settings.dispose();
    }
}

const ProfileSettingsElements = []
class ProfileSettings extends SvgPlus {
    constructor(el) {
        super(el);
        this._profileCards = {};
        this.settingsCard = document.querySelector('profile-section');
        ProfileSettingsElements.push(this);

        setTimeout(() => {
            for (let path of AllSettings.getAllSettingsFrames()) {
                this._addProfileCard(path);
            }
        }, 0);
   
        AllSettings.onSettingsUpdate(() => {
            this._updateAll();
        });
    }

    onCardClick(Settings, path) {
        this.settingsCard.loadSettings(Settings, path);
        for (let profileCard of Object.values(this._profileCards)) {
          profileCard.classList.remove("highlighted");
        }
        this._profileCards[path].classList.add("highlighted");
    }

    _addProfileCard(path) {
        if (!(path in this._profileCards)) {
            let Settings = AllSettings.getSettingsFrame(path);
            let profileCard = new ProfileCard(Settings, path);
            profileCard.addEventListener("click", () => this.onCardClick(Settings, path));
            this._profileCards[path] = profileCard;
            this.appendChild(profileCard);
            if (Settings.isDefault) {
              this.onCardClick(Settings, path);
            }
        }
    }

    _updateAll() {
        let newPaths = new Set(AllSettings.getAllSettingsFrames());
        for (let path of newPaths) {
            this._addProfileCard(path);
        }

        for (let path in this._profileCards) {
            if (!newPaths.has(path)) {
                this._removeProfileCard(path);
            }
        }
    }

    _removeProfileCard(path) {
        let profileCard = this._profileCards[path];
        if (profileCard) {
            profileCard.dispose();
            profileCard.remove();
            delete this._profileCards[path];
        }
    }

    add() {
        AllSettings.addSettingsFrame();
    }

}

SvgPlus.defineHTMLElement(ProfileSettings);

/**
 * Error when deleting
 */