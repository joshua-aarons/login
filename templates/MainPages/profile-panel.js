import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js";
import { } from "../input-plus.js"

useCSSStyle("theme");

class ProfilePanel extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("profile-panel");
        let els = this.els;
        this.details = els.details;
        let elsdetail = this.details.getElementLibrary();
        elsdetail.update.onclick = () => {
            this.updateUserData(this.details.value)
            this.dispatchEvent(new Event('updateDetails'));
        }
        els.uploadDP.onclick = () => this.openimage()
    }
    onvalue(value) {
        this.els.details.value = value
    }
    async openimage() {
        let input = new SvgPlus("input")
        input.props = {type:"file",accept:"image/*"}
        let image = await new Promise((resolve, reject) => {
            input.addEventListener("change", e => {
                if (input.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        resolve(evt.target.result);
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            })
            input.click()
        })
        this.updateUserData({displayPhoto: image})
    }
}

SvgPlus.defineHTMLElement(ProfilePanel);