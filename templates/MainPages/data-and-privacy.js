import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class DataAndPrivacy extends UserDataComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("data-and-privacy");
        this.els = this.getElementLibrary();
        this.els.optionalData.addEventListener("input", () => {
            this.updateUserData({optionalData: this.els.optionalData.checked})
        })
    }
}

SvgPlus.defineHTMLElement(DataAndPrivacy);