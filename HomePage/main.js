import { CustomComponent, DataComponent, SvgPlus, updateUserDataComponents, UserDataComponent } from "../Utilities/CustomComponent.js";
import { getHTMLTemplate, loadTemplates, useCSSStyle } from "../Utilities/template.js";
import {} from "../Utilities/gradient-background.js"
import { } from "../Utilities/hamburger-icon.js";
import { } from "../Utilities/gradient-model.js";
import { } from "../Utilities/carousel.js";
import { } from "../Utilities/hover.js";
import { addAuthChangeListener, get, initialise, update } from "../Firebase/firebase-client.js";
import { stopWatch, watch } from "../Firebase/user.js";
import { ContactPage } from "./templates/contact-page.js";
import { HomePage } from "./templates/home-page.js";
import { FeaturesPage } from "./templates/features-page.js";
import { onLocationChange, RouteQuery } from "../Utilities/router.js";
import { PricesPage } from "./templates/prices-page.js";
import {} from "./templates/trusted-companies.js"
import { getProductInfo } from "../Firebase/licences.js";
useCSSStyle("theme");
useCSSStyle("squidly-main");

window.scheduleCall = () => {
    window.open("https://calendly.com/joshua-aarons71/30min?month=2025-07", "_blank");
}
window.openPolicy = (policy) => {
    window.open(`https://policies.squidly.com.au/${policy}`, "_blank");
}

class MainPage extends UserDataComponent {
    constructor() {
        super("main-page");

        this.template = getHTMLTemplate("squidly-main");

        this.pages = {
            "contact-page": new ContactPage(),
            "home-page": new HomePage(),
            "prices-page": new PricesPage(),
            "features-page": new FeaturesPage(),
        }

        onLocationChange((location) => {
            this.page = location;
        }, "home-page");

        this.page = RouteQuery.fromWindow("home-page");

        window.openPage = (page) => {
            this.setPage(page);
        }

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

            for (let key in this.pages) {
                this.els[key + "-btn-list"]?.toggleAttribute("selected", key === query.location);
                this.els[key + "-btn"]?.toggleAttribute("selected", key === query.location);
            }
        }
    }


    setPage(value) {
        this.page = value;
        document.scrollingElement.scrollTo(0, 0);
        if (this.hamburgerMenuOpen) {
            this.toggleHamburger();
        }
    }


    gotoLicenses() {
        window.location = "/Console/#licences-page";
    }


    onvalue(v) {
        this.toggleAttribute("signed-in", v != null && v.isUser === true);
        
        let displayPhoto = v?.info?.displayPhoto || null;
        displayPhoto = displayPhoto ? `url("${displayPhoto}")` : null;
        
        this.els["displayPhoto-1"].style.setProperty("background-image", displayPhoto);
        this.els["displayPhoto-2"].style.setProperty("background-image", displayPhoto);
    }


    async toggleHamburger() {
        this.hamburgerMenuOpen = !this.hamburgerMenuOpen;
        this.els.hamburgerIcon.toggle(this.hamburgerMenuOpen)
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


async function getProducts(data) {
    let productInfo = await getProductInfo();
    data.productInfo = productInfo;
    console.log("Product Info: ", productInfo);
    
    updateUserDataComponents(data);
}

async function start() {
    let query = RouteQuery.fromWindow("home-page");
    await loadTemplates();

    // Start the main page
    const mainPage = new MainPage();
    document.body.appendChild(mainPage);

    let data = {}
    addAuthChangeListener((user) => {
        if (user != null) {
            data.isUser = true;
            watch(user.uid, data,  () => {
                updateUserDataComponents(data);
            });
        } else {
            data.isUser = false;
            stopWatch();
            updateUserDataComponents(data);
        }
    });
    initialise();
    if (query.location == "prices-page") {
        await getProducts(data);
    } else {
        getProducts(data);
    }

    

    await new Promise(resolve => setTimeout(resolve, 1000));

    document.querySelector("squidly-loader[full]").hide(0.5);
}


start();