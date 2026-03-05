/** @typedef {import("../../../../Firebase/firebase-frame.js").FirebaseFrame} FirebaseFrame */

const LANGUAGES = {
    english: {
        flag: "https://firebasestorage.googleapis.com/v0/b/eyesee-d0a42.appspot.com/o/icons%2Fall%2Fv9IAQ4u0oMQkqwLwBpfr?alt=media&token=e7a320a0-90d6-4a55-8b26-2aaba96e4242",
        voices: {
            margaret: true,
            jane: true,
            peter: true,
            charles: true,
            sarah: true,
            lachlan: true,
            jeffrey: true,
            theo: true,
            lucy: true,
            holly: true,
            default: true
        },
    },
    bengali: {
        flag: "https://firebasestorage.googleapis.com/v0/b/eyesee-d0a42.appspot.com/o/icons%2Fall%2F4XFjZmzE6VPkl3EEMHGK?alt=media&token=47322a32-8141-4829-9d0f-ff80aefd3250",
        voices: {
            প্রদীপ: true,
            ফাতেমা: true,
            ফুয়াদ: true,
            রানী: true,
        },
    },

    french:{
        flag: "https://firebasestorage.googleapis.com/v0/b/eyesee-d0a42.appspot.com/o/icons%2Fall%2FydIUDFL35AfMi0BaxQvV?alt=media&token=be15e86c-4235-43b9-b9b7-2bad19cfe4bc",
        voices: {
            louis: true,
            amélie: true,
            etienne: true,
            julia: true
        },
    },
    korean:{
        flag: "https://firebasestorage.googleapis.com/v0/b/eyesee-d0a42.appspot.com/o/icons%2Fall%2FPdXOuSWnLc1C9mIDyNcZ?alt=media&token=e0869cf1-f1aa-4fab-acf4-ef2cd9772e58",
        voices: {
            다빈: true,
            소영: true,
            민재: true,
            병준: true,
        }
    }
}

function getAllKeys(arr) {
    let keys = [];
    let r = (ri = 0, root = "") => { 
        if (ri >= arr.length)  {
            keys.push(root);
        } else {
            if (Array.isArray(arr[ri])) {
                for (let key of arr[ri]) {
                    r(ri + 1, (root ? root + "/" : "") + key);
                }
            } else if (typeof arr[ri] === "string") {
                r(ri + 1, (root ? root + "/" : "") + arr[ri]);
            }
        }
    }
    r(0, "");
   
    return keys;
}

class Setting {
    /**
     * @param {Object} options - The options for the setting
     * @param {string} name - The name of the setting
     * @param {FirebaseFrame} sdata - The session data frame
     */
    constructor(options, name, sdata, settings) {
        this.options = options;
        this.sdata = sdata;
        this.path = name;
        this._settings = settings;

        this._listener = sdata.onValue(name, (value) => {
            if (value === null) {
                value = options.default;
            }
            if (value !== this.value) {
                this._value = value;
                settings._onChange(name, value);
            }
        });
    }

    toggleValue() {
        if (this.options.type === "boolean") {
            this.value = !this.value;
        }
    }

    incrementValue(direction) {
        const {options, value} = this;
        if (options.type === "number") {
            let newValue = value + (direction > 0 ? options.step : -options.step);
            if (newValue > options.max) newValue = options.max;
            if (newValue < options.min) newValue = options.min;
            this.value = newValue;
        } else if (options.type === "option") {
            const selection = this.selection;
            let index = selection.indexOf(value);
            let newIndex = index + (direction > 0 ? 1 : -1);
            if (newIndex >= selection.length) newIndex = selection.length - 1;
            if (newIndex < 0) newIndex = 0;
            this.value = selection[newIndex];
        }
    }

    get sideDots() {
        const selection = this.selection;
        let sideDots = new Array(selection.length).fill(false);
        sideDots[selection.indexOf(this.value)] = true;
        return sideDots;
    }

    get selection() {
        let selection = [];
        if (this.options.type === "option") {
            selection = this.options.options;

            if (selection instanceof Function) {
                selection = selection(this, this._settings);
            }
        }

        return selection;
    }

    get selectionValues() {
        let selection = [];
        for (let option of this.selection) {
            let value = option;
            if (this.options.optionToText) {
                value = this.options.optionToText[option];
            } else {
                value = option[0].toUpperCase() + option.slice(1);
            }
            selection.push({value: option, displayValue: value});
        }
        return selection;
    }

    get name() {
        if (this.options.getName) {
            return this.options.getName(this, this._settings);
        } else {
            return this.path.split("/").pop();
        }
    }


    get icon(){
        let icon = {};
        if (this.options.toIcon) {
            icon = this.options.toIcon(this);
        } else {
            icon = this.value;
        }
        return icon;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        if (this.options.type === "number") {
            value = Math.max(this.options.min, Math.min(this.options.max, value));
        } else if (this.options.type === "option") {
            let selection = this.selection;
            if (!selection.includes(value)) {
                value = this.options.default;
            }
        }

        if (this.value !== value) {
            this._value = value;
            this.sdata.set(this.path, value);
            this._settings._onChange(this.path, value);
        }
    }

    toString() {
        if (this.options.toString) {
            return this.options.toString(this.value);
        } else {
            return this.value + "";
        }
    }

    dispose() {
        this._listener();
    }
}

export class SettingsDescriptor {
    constructor(setting, path) {
        this.path = path;
        for (let key in setting.options) {
            this[key] = setting.options[key];
        }
    }
}

export class SettingsFrame {
    constructor(dataFrame, settingsOptions = SettingOptions, listener) {
        this.__Settings = {};
        this.__SettingsChangeListeners = new Set();
        if (listener instanceof Function) {
            this.__SettingsChangeListeners.add(listener);
        }
        for (let options of settingsOptions) {
            let keys = getAllKeys(options.key);
            for (let key of keys) {
                this.__Settings[key] = new Setting(options, key, dataFrame, this);
            }
        }
        this.dataFrame = dataFrame;
    }

    /**
     * Gets the settings as an object, with keys corresponding to setting
     * paths and values as SettingsDescriptor objects containing the setting's 
     * value and options
     * @return {Object} The settings as an object
     */
    get settingsAsObject() {
        let obj = {};
        for (let path in this.__Settings) {
            let keys = path.split("/");
            let ref = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                let key = keys[i];
                if (!(key in ref)) {
                    ref[key] = {};
                }
                ref = ref[key];
            }
            let value = this.__Settings[path]
            ref[keys[keys.length - 1]] = new SettingsDescriptor(value, path);
        }
        return obj;
    }

    _onChange(...args) {
        for (let listener of this.__SettingsChangeListeners) {  
            listener(...args);
        }
    }

    _getSetting(name) {
        let setting = null;
        if (name in this.__Settings) {
            setting = this.__Settings[name];
        }
        return setting;
    }

    /**
     * Gets the value of a setting
     * @param {string} name - The name of the setting
     * @return {*} The value of the setting
     */
    getValue(name) {
        let setting = this._getSetting(name);
        let value = null;
        if (setting) {
            value = setting.value;
        }
        return value;
    }

    getSettingOptions(name) {
        let setting = this._getSetting(name);
        if (setting) {
            return {...setting.options, path: name};
        }
    }

    /**
     * Sets the value of a setting
     * @param {string} name - The name of the setting
     * @param {*} value - The value to set
     */
    setValue(name, value) {
        let setting = this._getSetting(name);
        if (setting) {
            setting.value = value;
        }
    }

    /**
     * Adds a change listener to the settings frame
     * @param {function} listener - The listener function to call when a setting changes.
     * @return {function} A function that can be called to remove the listener
     */
    addChangeListener(listener) {
        if (listener instanceof Function) {
            this.__SettingsChangeListeners.add(listener);

            for (let settingName in this.__Settings) {
                listener(settingName, this.__Settings[settingName].value);
            }

            return () => {
                this.__SettingsChangeListeners.delete(listener);
            }
        }
    }   

    /**
     * Gets the string value of a setting, using the setting's toString method if it exists
     * @param {string} name - The name of the setting
     * @return {string} The string value of the setting
     */
    getStringValue(name) {
        let setting = this._getSetting(name);
        let value = null;
        if (setting) {
            if (setting.options.toString) {
                value = setting.options.toString(setting.value);
            } else {
                value = setting.value;
            }
        }
       return value;
    }

    /**
     * Gets the selection options for a setting, if it is an option type setting
     * @param {string} name - The name of the setting
     * @return {Array} The selection options for the setting, or null if the setting is not an option type
     */
    getSelection(name) {
        let setting = this._getSetting(name);
        let options = null;
        if (setting) {
            options = setting.selectionValues;
        }
        return options;
    }

    /**
     * Gets the display name of a setting
     * @param {string} name - The name of the setting
     * @return {string} The display name of the setting
     */
    getName(name) {
        let setting = this._getSetting(name);
        let sname = null;
        if (setting) {
            sname = setting.name;
        }
        return sname;
    }

    /**
     * Increments the value of a setting if it is a number or option type setting
     * @param {string} name - The name of the setting
     * @param {number} direction - The direction to increment (positive or negative)
     */
    incrementValue(name, direction) {
        let setting = this._getSetting(name);
        if (setting) {
            setting.incrementValue(direction);
        }
    }

    /**
     * Toggles the value of a setting if it is a boolean type setting
     * @param {string} name - The name of the setting
     */
    toggleValue(name) {
        let setting = this._getSetting(name);
        if (setting) {
            setting.toggleValue();
        }
    }

    /**
     * Gets the icon representation of a setting, using the setting's toIcon method if it exists
     * @param {string} name - The name of the setting
     * @return {*} The icon representation of the setting
     */
    getIcon(name) {
        let setting = this._getSetting(name);
        let icon = {};
        if (setting) {
            icon = setting.icon;
        }
        return icon;
    }

    /**
     * Resets all settings to their default values
     */
    resetAllToDefault() {
        this.dataFrame.set(null, true)
    }

    /**
     * Resets all settings except for the specified exceptions to their default values
     * @param {string[]} exceptions - An array of setting names to exclude from resetting
     */
    resetAllExcept(exceptions) {
        for (let path in this.__Settings) {
            if (!exceptions.includes(path)) {
                this.dataFrame.set(path, null);
            }
        }
    }


    /**
     * Disposes of the settings frame and all of its settings, 
     * removing any listeners and freeing up resources
     */
    dispose() {
        for (let key in this.__Settings) {
            this.__Settings[key].dispose();
        }
    }
}

export const SettingOptions = [
    {
        key: [["host", "participant"], "access", ["dwellTime", "switchTime"]],
        type: "number",
        default: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
        toString(value){
            return Math.round(value * 10) / 10 + "";
        },
        toIcon({value, path}) {
            return {
                symbol: {text: this.toString(value) + "s"},
                displayValue: path.endsWith("dwellTime") ? "Eye Gaze" : "Switch",
            }
        },
        getName({path}) {
            return path.endsWith("dwellTime") ? "Eye Gaze Dwell Time" : "Switch Time";
        }
    },
    {
        key: [["host", "participant"], "keyboardShortcuts", ["v", "a", "f", "c", "g", "x", "q", "s", "e"]],
        type: "boolean",
        default: false,
        keyNames: {
            v: "Start/Stop Video",
            a: "Mute/Unmute Audio",
            f: "Start/Stop Screen Share",
            e: "Start/Stop Eye Gaze",
            x: "Start/Stop Switch Access",
            c: "Open/Close Calibration",
            g: "Open/Close AAC Grid",
            q: "Open/Close Quiz",
            s: "Open/Close Settings",
        },
        toIcon({value, path}) {
            return {
                // symbol: {url: ImageAssets.KeyboardIcons[path[path.length - 1]]},
                active: value,
                displayValue: this.getName({path}),
            }
        },
        getName({path}) {
            return this.keyNames[path[path.length-1]];
        }
    },
    {
        key: [["host", "participant"], "eye-gaze-enabled"],
        type: "boolean",
        default: false,
        toIcon({value}) {
            return {
                symbol: value ? "eye" : "noeye",
                displayValue: value ? "Eye-gaze Enabled" : "Eye-gaze Disabled",
            }
        },
        getName() {
            return "Eye-gaze Enabled";
        }
    },
    {
        key: [["host", "participant"], "volume", "level"],
        type: "number",
        default: 70,
        min: 0,
        max: 100,
        step: 5,
        toString(value){
            return Math.round(value) + "";
        },
        toIcon({value}) {
            return {
                symbol: {text: this.toString(value) + "%"},
                displayValue: "Volume",
            }
        },
        getName() {
            return "Volume";
        }
    },
    {
        key: [["host", "participant"], "languages", "voice"], 
        type: "option",
        default: "default",
        options: ({path}, settings) => {
            let languageKey = path.replace("/voice", "/language");
            let language = settings.getValue(languageKey) || "english";
            return Object.keys(LANGUAGES[language].voices);
        },
        
        toString(value){
            return value[0].toUpperCase() + value.slice(1);
        },

        toIcon(s) {
            const {value, selection} = s;
            if (!selection.includes(value)) {
                s.value = selection[selection.length - 1];
            }

            return {
                symbol: {text: this.toString(s.value)},
                displayValue: "Voice",
                sideDots: s.sideDots,
            }
        },
        getName() {
            return "Voice";
        }
    },
    {
        key: [["host", "participant"], "languages", "language"], 
        type: "option",
        default: "english",
        options: Object.keys(LANGUAGES).reverse(),
        toString(value){
            return value[0].toUpperCase() + value.slice(1);
        },
        toIcon({value, sideDots}) {
            return {
                symbol: {
                    url: LANGUAGES[value].flag,
                    width: 88
                },
                displayValue: this.toString(value),
                sideDots: sideDots,
            }
        },
        getName() {
            return "Language";
        }
    },
    {
        key: [["host", "participant"], "calibration", "size"],
        type: "option",
        default: "5",
        options: ["3", "4", "5", "6", "7"],
        toIcon({value, sideDots}) {
            return {
                symbol: {text: value},
                displayValue: "Size",
                sideDots: sideDots,
            }
        },
        getName() {
            return "Stimulous Size";
        }
    },
    {
        key: [["host", "participant"], ["languages", "calibration"], "speed"],
        type: "option",
        default: "medium",
        options: ["fast", "medium", "slow"],
        toIcon({value, sideDots}) {
            let upperCase = value[0].toUpperCase() + value.slice(1);
            return {
                symbol: "speed" + upperCase,
                displayValue: upperCase,
                sideDots: sideDots,
            }
        },
        getName() {
            return "Speed"
        }
    },
    {
        key: [["host", "participant"],"calibration", "guide"],
        type: "option",
        default: "default",
        options: ["default", "balloon", "squidly", "bee"],
        toIcon({value, sideDots}) {
            let upperCase = value[0].toUpperCase() + value.slice(1);
            return {
                // symbol: {
                //     url: ImageAssets.CalibrationGuides[value],
                // },
                displayValue: upperCase,
                sideDots: sideDots,
            }
        },
        getName() {
            return "Guide";
        }
    },
    {
        key: [["host", "participant"], "display", "layout"],
        type: "option",
        default: "v-side",
        options: ["v-side", "v-top"],
        optionToText: {
            "v-side": "Side",
            "v-top": "Top",
        },
        toIcon({value, sideDots}) {
            let upperCase = this.optionToText[value];
            return {
                symbol: value,
                displayValue: upperCase,
                sideDots: sideDots,
            }
        }
    },
    {
        key: [["host", "participant"], "display", "font"],
        type: "option",
        default: "default",
        options: ["inclusive", "atkinson", "opendyslexic", "default"],
        optionToText: {
            "default": "Default",
            "inclusive": "Inclusive Sans",
            "atkinson": "Atkinson Hyperlegible",
            "opendyslexic": "OpenDyslexic",
        },
        toIcon({value, sideDots}) {
            return {
                symbol: {text: "Aa", size: "3em"},
                sideDots: sideDots,
                displayValue: this.optionToText[value],
            }
        },
        getName() {
            return "Font";
        }
    },
    {
        key: [["host", "participant"], "display", "effect"],
        type: "option",
        default: "none",
        options: ["high-contrast-light", "high-contrast-dark", "low-sensory", "colorblind-assist", "greyscale", "sepia-calm", "enhanced-saturation", "none"],
        optionToText: {
            "none": "None",
            "enhanced-saturation": "Enhanced Saturation",
            "high-contrast-light": "High Contrast Light",
            "high-contrast-dark": "High Contrast Dark",
            "low-sensory": "Low Sensory",
            "colorblind-assist": "Colourblind Assist",
            "greyscale": "Greyscale",
            "sepia-calm": "Sepia Calm",
        },
        toIcon({value, sideDots}) {
            return {
                displayValue: this.optionToText[value],
                sideDots: sideDots,
            }
        },
        getName() {
            return "Effect";
        }
    },
    {
        key: [["host", "participant"], "cursors", "cursorSize"],
        type: "option",
        default: "none",
        options: ["none", "small", "medium", "large"],
        toIcon({value, sideDots}) {
            let upperCase = value[0].toUpperCase() + value.slice(1);
            return {
                // symbol: {
                //     url: ImageAssets.Cursors[value],
                // },
                displayValue: upperCase,
                sideDots: sideDots,
            }
        },
        getName() {
            return "Cursor Size";
        }
    },
    {
        key: [["host", "participant"], "cursors", "cursorColour"],
        type: "option",
        default: "colour-1",
        options: ["colour-1", "colour-2", "colour-3", "colour-4", "colour-5"],
        optionToText: {
            "colour-1": "Black/White",
            "colour-2": "White/Black",
            "colour-3": "Black/Yellow",
            "colour-4": "Black/Green",
            "colour-5": "Blue/Yellow",
        },
        toIcon({value, sideDots}) {
            return {
                // symbol: {
                //     url: ImageAssets.Cursors[value],
                // },
                displayValue: this.optionToText[value],
                sideDots: sideDots,
            }
        },
        getName() {
            return "Cursor Colour";
        }
    },
    {
        key: [["host", "participant"], "cursors", "cursorStyle"],
        type: "option",
        default: "arrow",
        options: ["arrow", "guide", "circle"],
        style2name: {
            "arrow": ["Arrow", "medium"],
            "guide": ["Guide", "guide"],
            "circle": ["Focus Ring", "circle"],
        },
        toIcon({value, sideDots}) {
            return {
                // symbol: {
                //     url: ImageAssets.Cursors[this.style2name[value][1]],
                // },
                displayValue: this.style2name[value][0],
                sideDots: sideDots,
            }
        },
        getName() {
            return "Cursor Style";
        }
    },
]