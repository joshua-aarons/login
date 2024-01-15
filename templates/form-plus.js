import { CustomForm, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class ProfilePanel extends CustomForm {
    onconnect(){
        
    }
}

SvgPlus.defineHTMLElement(ProfilePanel);