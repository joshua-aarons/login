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


        let col = this.createChild("div", {class: "side-margin feature-rows"});
        for (let i = 0; i < feature.children.length; i += 3) {
            let row = col.createChild("div", {class: "row feature-cards"});
            let section = (feature.children || []).slice(i, i+3)
            for (let child of section ) {
                console.log(child);
                
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