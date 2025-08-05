import { SvgPlus } from "../../SvgPlus/4.js";
import { getHTMLTemplate } from "../../Utilities/template.js";
import { TrustedCompanieLogos } from "../site-data.js";

class TrustedCompanies extends SvgPlus {
    constructor(el) {
        super(el);
    }
    onconnect() {
        this.innerHTML = "";
        this.createChild("div", {class: "text-1", style: {"text-align": "center"}, content: "Trusted by professionals at"});
        let logos = this.createChild("div", {class: "company-logos"})
        TrustedCompanieLogos.map((logo) => {
            logos.createChild("img", {src: logo.src, alt: logo.alt});
        });
    }
}
SvgPlus.defineHTMLElement(TrustedCompanies);