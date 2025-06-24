import { DataComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getStripeCheckout, openBillingPortal } from "../../Firebase/New/licences.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js";

useCSSStyle("theme");
useCSSStyle("licences-page");

class LicenceIcon extends DataComponent {
    constructor(licence) {
        super("licence-icon");
        this.template = `
        
        <div class = "row-slider">
            <div class = "row">
                <h2 name = "licenceName" vfield="html"></h2>
                <span>-</span>
                <span name = "tierName" vfield="html"></span>
            </div>

            <div class = "row">
                <span onclick = "openAdmin" hover = "Manage" class="material-symbols-outlined i-button">supervisor_account</span>
                <span class = "i-button" onclick = "openBilling" hover = "Billing" ><i class="fa-solid fa-credit-card"></i></span>
            </div>
        </div>
        <div class = "row-slider"> 
            <div> 
                seats: <span name = "usedSeats" vfield = "html"></span> / <span name = "seats" vfield="html">$</span>
            </div>
            <div ${!licence.disabled ? "active" : ""} class = "active-icon">
                ${licence.disabled ? "inactive" : "active"}
            </div>
        </div>
        `
        this.value = licence;
    }
    async openBilling(){
        await openBillingPortal(this.value.id, window.location+"")
    }

    openAdmin() {
        let id = this.value.id;
        let admin = document.querySelector("admin-control");
        admin.selectedLicence = id;
        document.querySelector("app-view").panel = "admin-control"
    }
    onvalue(v) {
        v.usedSeats = Object.keys(v.users).length;
    }
}

class LicenceProductCard extends DataComponent {
    constructor(licenceProduct, licencePage) {

        super("licence-product-card");
        this.template = `
                <h2>Squidly <span name = "tierName" vfield = "html"></span></h2>
                <option-slider toggle onchange = "updatePrice" name = "period">
                    <option value="monthly" selected>Monthly</option>
                    <option value="yearly">Yearly</option>
                </option-slider>
                <h1 class="price"><b name="price">$35.00</b><span>AUD</span> <i name="priceInfo" hover class="fa-solid fa-circle-info"></i></h1>
                <ul name = "featureList">
                </ul>
                <input-plus name = "seats" style = "width: min(100%, 8em);">
                    <input min="1" max="999" value="1" type="number" key="seats">
                    <label>seats</label>
                    <span class="icon material-symbols-outlined">group</span>
                </input-plus>

                <button name = "submit" onclick = "openBilling" class = "btn call-to-action"></button>
                <small class = "trial">7 day free trial.</small>
           `
        this.class = "card col c-align"
        this.value = licenceProduct;
        this.licencePage = licencePage;
        this.attachEvents(["onchange", "onclick"]);
        window.requestAnimationFrame(this.updatePrice.bind(this));
    }


    async openBilling() {
        const {value: {tierName}, els: {submit, period, seats}, licencePage: {els: {stripeMount, stripeMountPopup}}} = this;
        
        if (this.stripeCheckout) {
            this.stripeCheckout.unmount();
            this.stripeCheckout.destroy();
        }

        submit.classList.add("disabled")
        
        try {
            await new Promise((r) => setTimeout(r, 100))
            const checkout = await getStripeCheckout(period.value, seats.value, tierName);
            checkout.mount(stripeMount);
            this.stripeCheckout = checkout;
            stripeMountPopup.classList.add("open");
        } catch (e) {
            console.warn(e);
            showNotification("We were unable to connect with stripe,\nplease try again later", 3000, "error");
            stripeMountPopup.remove("open");
        }

        submit.classList.remove("disabled")
    }

   
    onvalue() {
        const { value: {features}, els: {featureList} } = this;
        features.innerHTML = "";
        features.forEach(feature => {
            let li = document.createElement("li");
            li.innerHTML = feature;
            featureList.appendChild(li);
        });
    }

    updatePrice(e) {
        const { value: {prices}, els: {period: {value}, priceInfo, price} } = this;
        
        price.innerHTML = `$${(prices[value] || 0).toFixed(2)}`;
        priceInfo.setAttribute("hover", `Price per seat per ${value.slice(0, -2)}`); // Remove the last 'y' from 'yearly' or 'monthly'
    }
}


const licenceProducts = [
     {
        licenceName: "Squidly Standard",
        tierName: "Standard",
        features: [
            "Meetings up to 240\nminutes per month",
            "Advanced custom session\neditors and accessibility tool",
            "Plan and schedule sessions",
            "Ongoing customer support"
        ],
        prices: {
            "monthly": 20,
            "yearly": 220
        }
    },
    {
        licenceName: "Squidly Pro",
        tierName: "Pro",
        features: [
            "Meetings up to 480\nminutes per month",
            "Advanced custom session\neditors and accessibility tool",
            "Plan and schedule sessions",
            "Ongoing customer support"
        ],
        prices: {
            "monthly": 35,
            "yearly": 400
        }
    },
   
]

class LicencesPage extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("licences-page");
        this.attachEvents(["onchange"]);

        this.els.licenceProducts.innerHTML = "";
        licenceProducts.forEach(product => {
            let card = new LicenceProductCard(product, this);
            this.els.licenceProducts.appendChild(card);
        });
    }


    close() {
        this.els.stripeMountPopup.classList.remove("open")
    }


    onvalue(value) {
        const {licencesList} = this.els;
        licencesList.innerHTML = "";
        let noLicence = true;
        if (value.licences) {
            value.licences.forEach(licence => licencesList.appendChild(new LicenceIcon(licence)));
            noLicence = value.licences.length == 0;
        }
        this.toggleAttribute("nolicences", noLicence)
    }
}

SvgPlus.defineHTMLElement(LicencesPage);