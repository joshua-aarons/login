import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate } from "../../Utilities/template.js";
import { Testimonials } from "../site-data.js";

export class HomePage extends UserDataComponent {
     constructor() {
        super("home-page");

        this.template = getHTMLTemplate("home-page");
 
        let carousel = this.els.reviews;
        
        let d = new SvgPlus("div");
        Testimonials.map((review) => {
            let c = d.createChild("div").createChild("div", { class: "review"} );
            c.createChild("div", {content: review.text});
            let reviewer = c.createChild("div", {class: "reviewer"});
            reviewer.createChild("img", {src: review.img || "https://firebasestorage.googleapis.com/v0/b/eyesee-d0a42.appspot.com/o/icons%2Fall%2FihHop3iUwO2YsFA3QPry?alt=media&token=1a44fb4f-3ebb-48ce-bb62-c4ed5b06080b", alt: "Family"});
            reviewer.createChild("span", {content: `${review.name} <br> <i>${review.title}</i>`});
        });

        carousel.innerHTML = d.innerHTML; 
    }


    gotoLicenses() {
        window.location = "/Console/#licences-page";
    }
}