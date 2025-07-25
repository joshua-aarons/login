import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"

useCSSStyle("theme");

class SettingsPanel extends UserDataComponent {
    onconnect(){
        this.template = getHTMLTemplate("settings-panel");
        let keys = ['hostVideo', 'participantVideo', 'hostAudio', 'participantAudio']
        for (let key of keys) {
            let input = this.els["info/"+key];
            input.addEventListener("input", () => {
                this.updateUserData({[key]: input.checked})
            })
          }
        }
}

SvgPlus.defineHTMLElement(SettingsPanel);