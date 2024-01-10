import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class DataAndPrivacy extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("data-and-privacy");
    }
}

SvgPlus.defineHTMLElement(DataAndPrivacy);