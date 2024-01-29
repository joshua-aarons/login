import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class DataAndPrivacy extends UserDataComponent {
    onconnect(){
        this.template = getHTMLTemplate("data-and-privacy");
        let optionalData = this.els["info/optionalData"];
        optionalData.addEventListener("input", () => {
            this.updateUserData({optionalData: optionalData.checked})
        })
    }

    onvalue(v) {
        console.log(v);
    }
}

SvgPlus.defineHTMLElement(DataAndPrivacy);