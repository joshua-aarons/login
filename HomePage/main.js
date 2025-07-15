import { CustomComponent, DataComponent, SvgPlus, updateUserDataComponents, UserDataComponent } from "../Utilities/CustomComponent.js";
import { getHTMLTemplate, loadTemplates, useCSSStyle } from "../Utilities/template.js";
import {} from "../Utilities/gradient-background.js"
import { } from "../Utilities/hamburger-icon.js";
// import { } from "../Utilities/gradient-model.js";
import { } from "../Utilities/carousel.js";
import { addAuthChangeListener, initialise, update } from "../Firebase/firebase-client.js";
import { stopWatch, watch } from "../Firebase/user.js";
import { ContactPage } from "./templates/contact-page.js";
import { HomePage } from "./templates/home-page.js";
import { FeaturesPage } from "./templates/features-page.js";
import { onLocationChange, RouteQuery } from "../Utilities/router.js";

useCSSStyle("theme");
useCSSStyle("squidly-main");


class MainPage extends UserDataComponent {
    constructor() {
        super("main-page");

        this.template = getHTMLTemplate("squidly-main");

        this.pages = {
            "contact-page": new ContactPage(),
            "home-page": new HomePage(),
            "features-page": new FeaturesPage(),
        }

        onLocationChange((location) => {
            this.page = location;
        }, "home-page");

        this.page = RouteQuery.fromWindow("home-page");

        document.addEventListener("scroll", (e) => {
            this.isScrolled = document.scrollingElement.scrollTop > 10;
            this.els.header.toggleAttribute("show-bg", this.isScrolled);
        })

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


    /**
     * @param {string | RouteQuery} value - The page to navigate to, e.g., "home-page", "contact-page", etc.
     */
    set page(value) {
        let query = RouteQuery.parse(value, "home-page");
        
        if (query.location in this.pages) {
            this.els.main.innerHTML = "";
            this.els.main.appendChild(this.pages[query.location]);
            query.setLocation();

           
        }
    }


    setPage(value) {
        this.page = value;
    }


    gotoLicenses() {
        window.location = "/Console/#licences-page";
    }


    onvalue(v) {
        this.toggleAttribute("signed-in", v != null);
        
        const displayPhoto = v?.displayPhoto || null;
        this.els["displayPhoto-1"].styles = {"background-image": displayPhoto};
        this.els["displayPhoto-2"].styles = {"background-image": displayPhoto};
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

}


async function start() {
    await loadTemplates();
    addAuthChangeListener((user) => {
        
        if (user != null) {
            let data = {}
            watch(user.uid, data,  () => {
                updateUserDataComponents(data.info);
            });
        } else {
            stopWatch();
            updateUserDataComponents(null);
        }
    });
    initialise();

    // Start the main page
    const mainPage = new MainPage();
    document.body.appendChild(mainPage);

    document.querySelector("squidly-loader[full]").hide(0.5);
}


start();