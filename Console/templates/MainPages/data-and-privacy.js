import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"

useCSSStyle("theme");

class DataAndPrivacy extends UserDataComponent {
    onconnect(){
        this.template = getHTMLTemplate("data-and-privacy");
        let keys = ['optionalData'];//, 'requiredData']
        for (let key of keys) {
            let input = this.els["info/"+key];
            input.addEventListener("input", () => {
                this.updateUserData({[key]: input.checked})
            })
        }
    }

}

SvgPlus.defineHTMLElement(DataAndPrivacy);