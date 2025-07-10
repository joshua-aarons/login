import { DataComponent, SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getStripeCheckout, getStripeCheckoutFromClientSecret, openBillingPortal } from "../../../Firebase/licences.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";

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

            <div class = "i-buttons row">
                <span onclick = "openAdmin" hover = "Manage" class="material-symbols-outlined i-button">supervisor_account</span>
                <span name = "billing" class = "i-button" onclick = "openBilling" hover = "Billing" ><i class="fa-solid fa-credit-card"></i></span>
            </div>
        </div>
        <div class = "row-slider"> 
            <div class = "users-info"> 
                users: <span name = "usedSeats" vfield = "html"></span> / <span name = "seats" vfield="html">$</span>
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
        this.toggleAttribute("editor", v.editor);
        this.toggleAttribute("owner", v.status === "owner");
        if (v.editor && v.users) {
            v.usedSeats = Object.keys(v.users).length;
        } else {
            v.usedSeats = 0;
        }
    }
}

class LicenceProductCard extends DataComponent {
    constructor(licenceProduct, licencePage) {

        super("licence-product-card");
        this.template = `
            <div class="col c-align">
                <h2>Squidly <span name = "name" vfield = "html"></span></h2>
                <option-slider toggle onchange = "updatePrice" name = "period">
                </option-slider>
                <h1 class="price"><b name="amountEl"></b><span name = "currencyEl">AUD</span> <i name="priceInfo" hover class="fa-solid fa-circle-info"></i></h1> 
                <b name = "userGuide" vfield="html"></b>
                <ul name = "featureList">
                </ul>
            </div>
                
            <div class="col c-align">
                <input-plus name = "seats" style = "width: min(100%, 8em);">
                    <input min="1" max="999" value="1" type="number" key="seats">
                    <label>users</label>
                    <span class="icon material-symbols-outlined">group</span>
                </input-plus>
                <button name = "submit" onclick = "openBilling" class = "btn call-to-action"></button>
                <small class = "trial">7 day free trial.</small>
            </div>
           `
        this.class = "card col c-align"
        this.value = licenceProduct;
        this.licencePage = licencePage;
        this.attachEvents(["onchange", "onclick"]);
        window.requestAnimationFrame(this.updatePrice.bind(this));
    }


    async openBilling() {
        const {value: {id}, els: {submit, period, seats}, licencePage} = this;
        submit.classList.add("disabled");
        await licencePage.openBilling(id, period.value, seats.value);
        submit.classList.remove("disabled");
    }

   
    onvalue(value) {
        const { value: {features, prices, attributes}, els: {featureList, period} } = this;
        if (Array.isArray(attributes)) {
            attributes.forEach(attr => this.toggleAttribute(attr, true));
        }
        period.innerHTML = "";
        prices.map((price, i) => {
            period.createChild("s-option", {
                value: i,
                selected: i == 0,
                content: price.name
            })
        })
        features.innerHTML = "";
        features.forEach(feature => {
            let li = document.createElement("li");
            li.innerHTML = feature;
            featureList.appendChild(li);
        });
    }

    updatePrice(e) {
        const { value: {prices}, els: {period: {value}, priceInfo, amountEl, currencyEl} } = this;
        
        const {amount, currency, interval} = prices[value] || {amount: 0, currency: "AUD"};
        amountEl.innerHTML = `$${(amount || 0).toFixed(2)}`;
        currencyEl.innerHTML = (currency || "AUD").toUpperCase();
        priceInfo.setAttribute("hover", `Price per user per ${interval}`); // Remove the last 'y' from 'yearly' or 'monthly'
    }
}


class LicencesPage extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("licences-page");
        this.attachEvents(["onchange"]);
        this._ready = true;
        this.params = this._params;
    }

    close() {
        this.els.stripeMountPopup.classList.remove("open")

    }

    set params(value) {
        if (Array.isArray(value) && value.length > 0) {
            if (!this._ready) {
                this._params = value;
            } else {
                if (value.length == 1) {
                    this.openBillingFromClientSecret(value[0])
                }
            }
        }
    }


        

    set licenceProducts(value) {
        this.els.licenceProducts.innerHTML = "";
        if (!value || typeof value !== "object") {
            return;
        }
        Object.values(value).forEach(product => {
            let card = new LicenceProductCard(product, this);
            this.els.licenceProducts.appendChild(card);
        });
    }

    async openBillingFromClientSecret(clientSecret) {
         const {els: {stripeMount, stripeMountPopup}} = this;

        if (this.stripeCheckout) {
            this.stripeCheckout.unmount();
            this.stripeCheckout.destroy();
        }
        
        try {
            const checkout = await getStripeCheckoutFromClientSecret(clientSecret)
            checkout.mount(stripeMount);
            this.stripeCheckout = checkout;
            stripeMountPopup.classList.add("open");
        } catch (e) {
            console.warn(e);
            showNotification(typeof e === "string" ? e : "We were unable to connect with stripe,\nplease try again later", 3000, "error");
            stripeMountPopup.remove("open");
        }
    }

    async openBilling(productID, priceIndex = 0, seats = 1) {
        const {els: {stripeMount, stripeMountPopup}} = this;

        if (this.stripeCheckout) {
            this.stripeCheckout.unmount();
            this.stripeCheckout.destroy();
        }
        
        try {
            const checkout = await getStripeCheckout(productID, priceIndex, seats);
            checkout.mount(stripeMount);
            this.stripeCheckout = checkout;
            stripeMountPopup.classList.add("open");
        } catch (e) {
            console.warn(e);
            showNotification(typeof e === "string" ? e : "We were unable to connect with stripe,\nplease try again later", 3000, "error");
            stripeMountPopup.remove("open");
        }
    }

    onvalue(value) {
        const {licencesList} = this.els;
        licencesList.innerHTML = "";
        let noLicence = true;
        if (value.licences) {
            const {licences} = value;
            licences.forEach(licence => licencesList.appendChild(new LicenceIcon(licence)))
            noLicence = value.licences.length == 0;
        }
        this.licenceProducts = value.licenceProducts;

        this.toggleAttribute("nolicences", noLicence)
    }
}

SvgPlus.defineHTMLElement(LicencesPage);