import { SvgPlus } from "../../../../SvgPlus/4.js";
import { SettingsFrame } from "./settings-base.js";


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
    /**
     * @param {SettingsFrame} Settings
     */
    constructor(Settings) {
        super("div");
        this.class = "profile-card";
        this.profileImage = this.createChild(BGImg);
        this.profileName = this.createChild("span", {content: "Default"});
        this.profileID = Settings.id;

        this._removeListener = Settings.addChangeListener((path, value) => {
            if (path === "profileSettings/name") {
                this.profileName.innerHTML = value || "Untitled Profile";
            } else if (path === "profileSettings/image") {
                this.profileImage.src = value || null;
            }
        });
    }
    
    set selected(v) {
        this.toggleAttribute("selected", v);
    }

    dispose() {
        if (this._removeListener) {
            this._removeListener();
            this._removeListener = null;
        }
    }
}

export class ProfileList extends SvgPlus {
    constructor() {
        super("profile-list");
    }

    /**
     * Sets the list of profiles to display in the profile list. 
     * Each profile should be a SettingsFrame object.
     * @param {SettingsFrame[]} profiles
     */
    set profiles(profiles) {
        for (let child of this.children) {
            if (child instanceof ProfileCard) {
                child.dispose();
            }
        }
        this.innerHTML = "";

        let selected = null;
        for (let profile of profiles) {
            let profileCard = this.createChild(ProfileCard, {events: {
                click: () => this.selectProfile(profile.id)
            }}, profile);
            if (this.selected === profile.id) {
                profileCard.selected = true;
                selected = profile.id;
            } 
        }

        if (selected === null) {
            this.selectProfile("default");
        } else {
            this._selected = selected;
        }
    }

    /**
     * Gets the currently selected profile ID
     * @return {string} The currently selected profile ID
     */
    get selected() {
        return this._selected;
    }

    /**
     * Selects a profile by its ID and dispatches a "profile-selected" 
     * event with the selected profile ID as the detail
     * @param {string} profileID - The ID of the profile to select
     */
    selectProfile(profileID) {
        for (let child of this.children) {
            child.selected = child.profileID === profileID;
        }
        this._selected = profileID;
        this.dispatchEvent(new CustomEvent("profile-selected", {detail: profileID}));
    }
}