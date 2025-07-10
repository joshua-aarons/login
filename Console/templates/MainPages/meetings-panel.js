import { CustomComponent, SvgPlus } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"

useCSSStyle("theme");

class MeetingsPanel extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("meetings-panel");
    }
}

SvgPlus.defineHTMLElement(MeetingsPanel);