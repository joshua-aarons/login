import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../Utilities/template.js";
import { Features } from "../site-data.js";

useCSSStyle("features-page");
class FeaturePanel extends SvgPlus {
    constructor(feature) {
        super("feature-panel");
        this.class = "side-margin-always"
        let s = this.createChild("div", {class: "side-margin"})
        s.innerHTML = `
        <gradient-background class = "inside-text" img-src = "../images/gradient-background.png" speed="0.001">
            <div class = "description">
                <h1>${feature.title}</h1>
                <p>${feature.text}</p>
            </div>
            <div class = "image">
                <img src="${feature.image}" alt="${feature.title}">
            </div>
        </gradient-background>`;

        let row = s.createChild("div", {class: "row feature-cards"});
        for (let child of feature.children.slice(0, 3) || []) {
            let c = row.createChild("div", {
                class: "col card",
            });
            if (child.image) {
                c.createChild("img", {src: child.image, alt: child.title});
            }
            
            let cc = c.createChild("div", {class: "col"})
            cc.createChild("h3", {content: child.title});
            cc.createChild("p", {content: child.text});
            
        }
    }
}

export class FeaturesPage extends UserDataComponent {
     constructor() {
        super("features-page");
        // this.template = getHTMLTemplate("features-page");
        Features.forEach((feature) => {
            this.createChild(FeaturePanel,{},feature);
        })
    }


    gotoLicenses() {
        window.location = "/Console/#licences-page";
    }
}