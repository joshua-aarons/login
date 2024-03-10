import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class SettingsPanel extends UserDataComponent {
    onconnect(){
        this.template = getHTMLTemplate("settings-panel");
        let hostVideo = this.els["info/hostVideo"];
        hostVideo.addEventListener("input", () => {
            this.updateUserData({hostVideo: hostVideo.checked})
        })
        let participantVideo = this.els["info/participantVideo"];
        participantVideo.addEventListener("input", () => {
            this.updateUserData({participantVideo: participantVideo.checked})
        })
        let hostAudio = this.els["info/hostAudio"];
        hostAudio.addEventListener("input", () => {
            this.updateUserData({hostAudio: hostAudio.checked})
        })
        let participantAudio = this.els["info/participantAudio"];
        participantAudio.addEventListener("input", () => {
            this.updateUserData({participantAudio: participantAudio.checked})
        })
    }

}

SvgPlus.defineHTMLElement(SettingsPanel);