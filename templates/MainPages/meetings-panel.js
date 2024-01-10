import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class MeetingsPanel extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("meetings-panel");
    }
}

SvgPlus.defineHTMLElement(MeetingsPanel);