import { captilise } from "../../../../Utilities/utils.js";
import { SvgPlus, Vector } from "../../../../SvgPlus/4.js";

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
    constructor({options, path}, settings) {
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
    constructor(setting, Settings) {
        super("div");
        this.class = "setting-option-input";
        let settingName = captilise(Settings.getName(setting));
        if (setting.split("/")[0] === "calibration") {
          settingName = "Calibration " + settingName;
        }

        this.createChild("span", {innerHTML: settingName});

        const option = Settings.getSettingOptions(setting);
        switch(option.type) {
            case "boolean":
                const props = setting === "eye-gaze-enabled" ? {for: settingName, class: "switch"} : {for: settingName};
                const spanClass = setting === "eye-gaze-enabled" ? {class: "slider round"} : {class: "checkmark"};
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
                this.input = this.createChild(Selection, {}, option, Settings);
                break;

            case "file":
                this.input = this.createChild(FileUploader, {}, option, Settings);
                break;
        }

        this.option = option;

        this.input.addEventListener("change", () => {
            Settings.setValue(option.path, this.value);
        });

        this._removeListener = Settings.addChangeListener((path, newValue) => {
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

    dispose() {
        if (this._removeListener) {
            this._removeListener();
            this._removeListener = null;
        }
    }
}

class SettingsTab extends SvgPlus {
    constructor(icon, category) {
      super("div");
      this.createChild("div", {class: "material-symbols-outlined icon", innerHTML: icon});

      this.category = category;

      let description = captilise(category.replace(/([a-z])([A-Z])/g, '$1 $2'));
      this.setAttribute("title", description);
    }

    set active(value) {
        this.toggleAttribute("active", value);
    }

    get active() {
        return this.hasAttribute("active"); 
    }
}

export class SettingsPanel extends SvgPlus {
    constructor(Settings) {
        super("div");
        this.class = "profile-settings-panel";

        // create header
        let settingsHeader = this.createChild("div", {class: "settings-header"});
        let h = settingsHeader.createChild("div")
        h.createChild("i", {class: "fa-solid fa-gear"});
        h.createChild("span", {innerHTML: "Settings"});


        let b = settingsHeader.createChild("div", {class: "clickable", events: {
                click: () => Settings.resetAllExcept([
                    "profileSettings/name",
                    "profileSettings/image"
                ])
        }});
        b.createChild("i", {class: "fa-solid fa-arrows-rotate"})
        b.createChild("span", {innerHTML: "Reset"});


        // create content areas
        let content = this.createChild("div", {class: "settings-content"});
        let tabsContainer = content.createChild("div", {class: "tabs-container"});
        let settingsOptions = content.createChild("div", {class: "settings-options"});


        const sMode = Settings.isDefault ? 1 : 2;

        // create sections and tabs
        this.sections = {}
        for (let {settings, name, icon, mode} of SettingsPanel.layout) {
            if ((sMode & mode) !== 0) {
                let section = settingsOptions.createChild("section", {name, hidden: true});
                for (let setting of settings) {
                    section.createChild(SettingOptionInput, {}, setting, Settings);
                }
    
                let tab = tabsContainer.createChild(SettingsTab, {
                    class: "tab",
                    events: {click: () => this.onTabClick(name)}
                }, icon, name);
    
                this.sections[name] = {section, tab};
            }
        }

        this.onTabClick(Object.keys(this.sections)[0]);
    }

    /**
     * Selects the given section and highlights the corresponding tab
     * @param {string} sectionName - The name of the section to select
     */
    onTabClick(sectionName) {
        for (let name in this.sections) {
            const {section, tab} = this.sections[name];
            section.toggleAttribute("hidden", sectionName !== name);
            tab.toggleAttribute("active", sectionName === name);
        }
    }

    /**
     * Disposes of the settings panel and all of its child components, 
     * removing any listeners and freeing up resources.
     */
    dispose() {
        for (let name in this.sections) {
            const {section} = this.sections[name];
            let children = [...section.children]
            children.forEach(child => {
                if (child.dispose) {
                    child.dispose();
                }
            });
        }
    }

    static get layout() {
        return [
            {
                name: "display",
                icon: "desktop_windows",
                mode: 1,
                settings: [
                    "display/layout",
                    "display/font",
                    "display/effect",
                ]
            },
            {
                name: "display",
                icon: "desktop_windows",
                mode: 2,
                settings: [
                    'profileSettings/name',
                    "profileSettings/image",
                    "display/layout",
                    "display/font",
                    "display/effect",
                ]
            },
            {
                name: "access",
                icon: "accessibility_new",
                mode: 3,
                settings: [
                    "access/dwellTime",
                    "access/switchTime",
                    "eye-gaze-enabled",
                    "volume/level",
                    "calibration/speed",
                    "calibration/guide",
                    "calibration/size"
                ]
            },
            {
                name: "keyboardShortcuts",
                icon: "keyboard",
                mode: 3,
                settings: [
                    "keyboardShortcuts/v",
                    "keyboardShortcuts/a",
                    "keyboardShortcuts/f",
                    "keyboardShortcuts/e",
                    "keyboardShortcuts/x",
                    "keyboardShortcuts/c",
                    "keyboardShortcuts/g",
                    "keyboardShortcuts/q",
                    "keyboardShortcuts/s",
                ]
            },
            {
                name: "languages",
                icon: "language",
                mode: 3,
                settings: [
                    "languages/language",
                    "languages/voice",
                    "languages/speed",
                ]
            },
            {
                name: "cursors",
                icon: "arrow_selector_tool",
                mode: 3,
                settings: [
                    "cursors/cursorSize",
                    "cursors/cursorColour",
                    "cursors/cursorStyle"
                ]
            }
        ]
    }
}
