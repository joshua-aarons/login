import { set } from "../../../Firebase/firebase-client.js";
import { SvgPlus, Vector } from "../../../SvgPlus/4.js";
import { DataComponent } from "../../../Utilities/CustomComponent.js";
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
      if (this.category === "display") {
          this.sections[this.category].toggleAttribute("hidden");
      }
      this.addEventListener("click", this.onTabClicked);
    }

    onTabClicked() {
      for (let key in this.sections) {
        let section = this.sections[key];
        section.hidden = true;
      }
      this.sections[this.category].toggleAttribute("hidden");
      document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.remove("active");
      })
      this.classList.add("active");
    }
}

class SettingsCard extends SvgPlus {
    constructor(el) {
      super(el);
      this.icons = {
        display: "desktop_windows",
        access: "accessibility_new",
        keyboardShortcuts: "keyboard",
        languages: "language",
        cursors: "arrow_selector_tool"
      }
    }

    loadSettings(Settings, path) {
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
        
        let sections = {}
        for (let category in newSettingsDescriptor) {
          let section = this.settingsOptions.createChild("section", {name: category, hidden: true});
          for (let key in newSettingsDescriptor[category]) {
              let value = newSettingsDescriptor[category][key];
              section.createChild(SettingOptionInput, {}, value, key, Settings);
          }
          sections[category] = section;
          this.tabsContainer.createChild(SettingsTab, {class: "tab"}, this.icons[category], category, sections)
        }
    }
}

SvgPlus.defineHTMLElement(SettingsCard);

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
        this.settingsCard = document.querySelector('settings-card');
        ProfileSettingsElements.push(this);

        for (let path of AllSettings.getAllSettingsFrames()) {
            this._addProfileCard(path);
        }

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