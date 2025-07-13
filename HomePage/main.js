import { CustomComponent, DataComponent, SvgPlus } from "../Utilities/CustomComponent.js";
import { getHTMLTemplate, loadTemplates, useCSSStyle } from "../Utilities/template.js";
import {} from "../Utilities/gradient-background.js"
import { } from "../Utilities/hamburger-icon.js";
import { } from "../Utilities/gradient-model.js";
import { } from "../Utilities/carousel.js";
import { Testimonials } from "./testimonals.js";
import { addAuthChangeListener, initialise } from "../Firebase/firebase-client.js";
import { stopWatch, watch } from "../Firebase/user.js";

useCSSStyle("theme");
useCSSStyle("home-main");

initialise();
class MainPage extends DataComponent {
    constructor() {
        super("main-page");

        addAuthChangeListener((user) => {
            this.toggleAttribute("signed-in", user != null);
            if (user != null) {
                let data = {}
                watch(user.uid, data,  () => {
                    this.value = data.info;
                    console.log(data.info);
                    
                });
            } else {
                stopWatch();
            }
        });
                // User is signed in, redirect to console

        this.template = getHTMLTemplate("home-main");

 
        let carousel = this.els.reviews;
        let d = new SvgPlus("div");
        Testimonials.map((review) => {
            let c = d.createChild("div").createChild("div", { class: "review"} );
            c.createChild("div", {content: review.text});
            let reviewer = c.createChild("div", {class: "reviewer"});
            reviewer.createChild("img", {src: review.img || "https://firebasestorage.googleapis.com/v0/b/eyesee-d0a42.appspot.com/o/icons%2Fall%2FihHop3iUwO2YsFA3QPry?alt=media&token=1a44fb4f-3ebb-48ce-bb62-c4ed5b06080b", alt: "Family"});
            reviewer.createChild("span", {content: `${review.name} <br> <i>${review.title}</i>`});
        })
        carousel.innerHTML = d.innerHTML;
        
        document.addEventListener("scroll", (e) => {
            this.isScrolled = document.scrollingElement.scrollTop > 10;
            this.els.header.toggleAttribute("show-bg", this.isScrolled);


            // const {els: {modelRow, model1, model2, model3}} = this;
            // let y = (modelRow.offsetTop + modelRow.clientHeight/2 - document.scrollingElement.scrollTop) / window.innerHeight;
            // y = y < 0 ? 0 : y > 1 ? 1 : y;
            // y = (y - 0.5) * Math.PI;

            // for (let model of [model1, model2, model3]) {
            //     model.xRotation = y;
            // }
        })

        // const blobSpeed_slow = 0.001;
        // const blobSpeed_fast = 0.01;
        // const rotationSpeed_slow = 0.00005;
        // const rotationSpeed_fast = 0.001;
   

        // for (let i = 1; i <= 3; i++) {
        //     let model = this.els[`model${i}`];
        //     let card = this.els[`model${i}card`];
        //     card.onmouseenter = (e) => {
        //         model.rotationSpeed = rotationSpeed_fast;
        //         model.speed = blobSpeed_fast;
        //     }
        //     card.onmouseleave = (e) => {
        //         model.rotationSpeed = rotationSpeed_slow
        //         model.speed = blobSpeed_slow;
        //     }
        // }

        let diff = window.outerHeight - window.visualViewport.height;
        if (diff > 0) {
            this.styles = {
                "--inner-height": window.visualViewport.height + "px",
                "--outer-height": window.outerHeight + "px",
            };
        } else {
            this.styles = {
                "--inner-height": "100vh",
                "--outer-height": "100vh",
            };
        }
        
    }


    onvalue(v) {
        if (v.displayPhoto) {
            this.els["displayPhoto-1"].src = v.displayPhoto
            this.els["displayPhoto-2"].src = v.displayPhoto
        }
    }


    async toggleHamburger() {
        this.hamburgerMenuOpen = !this.hamburgerMenuOpen;

        if (!this.isScrolled && this.hamburgerMenuOpen) {
            this.els.header.toggleAttribute("show-bg", true);
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        this.els.header.toggleAttribute("open", this.hamburgerMenuOpen);

        if (!this.hamburgerMenuOpen && !this.isScrolled) {
            await new Promise(resolve => setTimeout(resolve, 300));
            this.els.header.toggleAttribute("show-bg", false);
        }
    }

        

    // init() {
    //     // Initialize the main page
    //     console.log("MainPage initialized");
    // }
}


async function start() {
    await loadTemplates();
    // Start the main page
    const mainPage = new MainPage();
    document.body.appendChild(mainPage);

    document.querySelector("squidly-loader[full]").hide(0.5);
}
start();