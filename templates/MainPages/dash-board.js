import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class DashBoard extends UserDataComponent {
    onconnect(){
        this.template = getHTMLTemplate("dash-board");
    }
}

SvgPlus.defineHTMLElement(DashBoard);