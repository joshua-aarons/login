import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate } from "../../Utilities/template.js";

export class FeaturesPage extends UserDataComponent {
     constructor() {
        super("features-page");

        this.template = getHTMLTemplate("features-page");
    }


    gotoLicenses() {
        window.location = "/Console/#licences-page";
    }
}