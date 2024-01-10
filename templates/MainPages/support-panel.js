import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class SupportPanel extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("support-panel");
    }
}

SvgPlus.defineHTMLElement(SupportPanel);