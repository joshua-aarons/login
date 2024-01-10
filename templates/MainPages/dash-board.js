import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class DashBoard extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("dash-board");
    }
}

SvgPlus.defineHTMLElement(DashBoard);