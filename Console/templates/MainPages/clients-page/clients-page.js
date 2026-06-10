import { DataComponent, SvgPlus, UserDataComponent } from "../../../../Utilities/CustomComponent.js";
import { useCSSStyle } from "../../../../Utilities/template.js";
import { ProfileSessionHistory } from "./profile-history.js";
import { ProfileSessionTrends } from "./profile-trends.js";
import { ProfileList } from "./profile-list.js";
import { SettingsFrame } from "./settings-base.js";
import { SettingsPanel } from "./settings-panel.js";
import * as AllSettings from "./settings.js";

useCSSStyle("clients-page");

class ToggleList extends SvgPlus {
    #itemButtons = new Map();
    #selected = null;
    constructor(items) {
        super("div");
        this.class = "toggle-list";
        this.toggleIndicator = this.createChild("div", {class: "toggle-indicator"});
        items.forEach((item, i) => {
            let btn = this.createChild("span", {innerHTML: item, events: {
                click: () => { this.select(item); }
            }});
            this.#itemButtons.set(item, btn);
        })

        this.select(items[0], false);

        let resizeObserver = new ResizeObserver(() => {
            this.select(this.#selected, false);
        });
        resizeObserver.observe(this);
    }

    select(value, dispatch = true) {
        let [pos, size] = this.bbox;
        let selectedButton = this.#itemButtons.get(value);
        if (selectedButton) {
            let [bpos, bsize] = selectedButton.bbox;

            let buttonBoxWidth = bsize.x;
            let buttonBoxLeft = bpos.sub(pos).x;

            this.toggleIndicator.styles = {
                width: `${buttonBoxWidth}px`,
                transform: `translateX(${buttonBoxLeft}px)`
            }

            this.#itemButtons.forEach((btn, item) => {
                btn.toggleAttribute("active", item === value);
            })

            this.#selected = value;
            if (dispatch) this.dispatchEvent(new CustomEvent("select", {detail: value}));
        }
    }

    set selected(value) {
        this.select(value, false);
    }

    get selected() {
        return this.#selected;
    }
}

const PanelModes = {
    "Settings": "settings",
    "Session History": "session-history",
    "Session Trends": "session-trends",
}
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
        let row = h.createChild("div", {class: "row-space"});
        this.toggleButton = row.createChild(ToggleList, {events: {
            select: (e) => {
                this.setToggleState(e.detail);
            }
        }}, Object.keys(PanelModes));

        this.buttons2 = row.createChild("div", {class: "button-row"});

        // Main section        
        this.main = this.createChild("div", {class: "main"});

        this.toggleButton.select("Settings");
    }

    onvalue(data) {
        const logs = data?.sessionLogs?.[this.selctedProfileID] || {};
        if (this.historyPanel && data) {
            this.historyPanel.logs = logs;
        }
        if (this.trendsPanel && data) {
            this.trendsPanel.logs = logs;
        }
    }

    setToggleState(state) {
        console.log("Toggling to state:", state, PanelModes[state]);
        this.setAttribute("mode", PanelModes[state] || "");
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
       
        // Dispose of any existing change listener
        if (this._changeListener) {
            this._changeListener();
            this._changeListener = null;
        }

        // Clear main content and buttons
        this.main.innerHTML = "";
        this.buttons.innerHTML = "";
        this.buttons2.innerHTML = "";

        if (frame) {
            // Create new settings panel
            this.settingsPanel = this.main.createChild(SettingsPanel, {}, frame);

            // Create static link button immediately in the header row for all profiles
            let staticLinkBtn = this.buttons.createChild("button", {class: "btn", innerHTML: "Static Link"});
            staticLinkBtn.createChild("i", {class: "fa-solid fa-clipboard", style: {"margin-left": "0.5em"}});
            staticLinkBtn.addEventListener("click", async () => {
                const proxyID = frame.getValue("proxyID");
                try {
                    const url = `${window.location.origin}/Session/?${proxyID}&proxy`;
                    staticLinkBtn.styles = { opacity: "0.5", pointerEvents: "none" };
                    await navigator.clipboard.writeText(url);
                    showNotification("Static link copied to clipboard.", 3000, "success");
                    setTimeout(() => {
                        staticLinkBtn.styles = { opacity: "1", pointerEvents: "auto" };
                    }, 500);
                } catch (e) {
                    showNotification("Failed to copy static link.", 3000, "error");
                }
            });

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
            this.trendsPanel  = this.main.createChild(ProfileSessionTrends,  {name: "session-trends"});
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
            this.profilePanel = profilePanel;

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
                    const pid = e.detail;
                    const frame = AllSettings.getSettingsFrame(pid);
                    this.lastPID = pid;
                    this.lastFrame = frame;
                    profilePanel.settings = frame;
                }
            }})
        
            AllSettings.onSettingsUpdate(this.onSettingsUpdate.bind(this));
            this.isBuilt = true;
        }
    }


    onSettingsUpdate() {
        console.log("Settings updated, refreshing profile list");
        this.profilesList.profiles = AllSettings.getAllSettingsFrames();
        if (!this.lastFrame && this.lastPID) {
            this.profilePanel.settings = AllSettings.getSettingsFrame(this.lastPID);
        }

    }
}

SvgPlus.defineHTMLElement(ClientsPage);