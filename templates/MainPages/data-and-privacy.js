import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

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