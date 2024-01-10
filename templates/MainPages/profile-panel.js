import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class ProfilePanel extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("profile-panel");
    }
}

SvgPlus.defineHTMLElement(ProfilePanel);