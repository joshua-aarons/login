import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import {} from "./Profiles/client-profiles.js";

useCSSStyle("theme");

class SettingsPanel extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("settings-panel");
        let keys = ["hostVideo", "participantVideo", "hostAudio", "participantAudio"];
        for (let key of keys) {
            let input = this.els && this.els["info/" + key];
            if (input && input.addEventListener) {
                input.addEventListener("input", () => {
                    this.updateUserData({ [key]: input.checked });
                });
            }
        }
    }
}

SvgPlus.defineHTMLElement(SettingsPanel);