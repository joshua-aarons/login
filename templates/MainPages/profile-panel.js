import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js";
import { } from "../input-plus.js"

useCSSStyle("theme");

class ProfilePanel extends CustomComponent {
    onconnect() {
        this.innerHTML = getHTMLTemplate("profile-panel");
        let els = this.getElementLibrary();
        this.details = els.details;
        let elsdetail = this.details.getElementLibrary();
        elsdetail.update.onclick = () => {
            this.dispatchEvent(new Event('updateDetails'));
        }
        this.els = els
    }
    set value(value) {
        this.details.value = value
        for (let key in value) {
            if (key in this.els) {
                let el = this.els[key];
                let fieldtype = el.getAttribute('vfield')
                switch (fieldtype) {
                    case "innerHTML": el.innerHTML = value[key];
                        break;
                    case "src": el.setAttribute('src', value[key]);
                        break;
                    case "value": el.setAttribute('value', value[key]);
                        break;
                }
            }
        }
    }
}

SvgPlus.defineHTMLElement(ProfilePanel);