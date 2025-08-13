import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { LicenceProductCard } from "../../Console/templates/MainPages/licences-page.js";
import { RouteQuery } from "../../Utilities/router.js";
import { getHTMLTemplate, useCSSStyle } from "../../Utilities/template.js";
import { FAQ } from "../site-data.js";


class LicenceProductCardLink extends LicenceProductCard {
   async openBilling() {
        const {value: {prices, id}, els: {submit, period, seats}, licencePage} = this;

        let data = {
            productID: id,
            priceIndex: parseInt(period.value),
            seats: parseInt(seats.value),
        }

        let hashURL = new RouteQuery("licences-page", data);
        hashURL.setLocation("Console");
    }
   
}




useCSSStyle("prices-page");
export class PricesPage extends UserDataComponent {
     constructor() {
        super("prices-page");
        this.template = getHTMLTemplate("prices-page");
        this.makeFAQ(3);
    }


    makeFAQ(cols){
        let qas = FAQ.questions.map((faq) => {
            let qa = new SvgPlus("div");
            qa.class = "card";
            qa.createChild("h3", {class: "question", content: faq.question});
            qa.createChild("p", {class: "answer", content: faq.answer});
            return qa;
        });
        let last = new SvgPlus("div");
        last.class = "outline";
        let lastInner = last.createChild("div");
        lastInner.class = "card last-question";
        lastInner.createChild("h3", {class: "question", content: FAQ.lastQuestion.question});
        lastInner.createChild("p", {class: "answer", content: FAQ.lastQuestion.answer});
        let r = lastInner.createChild("div", {class: "row"});
        r.createChild("button", {
            class: "btn btn-primary", 
            content: FAQ.lastQuestion["purple-btn"],
            events: {
                click: () => {
                    document.querySelector("main-page").page = "contact-page";
                }
            }
        });
        r.createChild("button", {
            class: "btn btn-secondary",
            color: "gray", 
            content: FAQ.lastQuestion["white-btn"],
            events: {
                click: () => {
                    window.scheduleCall();
                }
            }
        });
        lastInner.appendChild(r);
        this.els.faq.appendChild(last);
        qas.push(last);

        let length = qas.length;
        let n = Math.round(length / cols);
        let elCols = new Array(cols).fill(0).map((_, i) => {
            let colEls = i == cols-1 ? qas.slice(i * n) : qas.slice(i * n, (i + 1) * n);
            let col = new SvgPlus("div");
            col.class = "col";
            colEls.forEach((el) => {
                col.appendChild(el);
            });
            this.els.faq.appendChild(col);
        });
    }

    onvalue(data) {
        const {productsList} = this.els;
        
        if (data?.productInfo?.tierInfo) {
            productsList.innerHTML = `<licence-product-card class="card col c-align">
                <div class="col c-align">
                    <h2>Squidly Hobby</h2>
                    <h1 class="price"><b>Free</b></h1>
                    <ul class="feature-list">
                        <li>Limited meeting minutes</li>
                        <li>Limited quiz and grid editor requests</li>
                    </ul>
                </div>
                <div class="col c-align">
                    <button onclick = "window.open('/Console')" name="signup" class = "btn call-to-action"></button>
                </div>
            </licence-product-card>`;
            const {tierInfo} = data.productInfo;
            for (let tier in tierInfo) {
                productsList.appendChild(new LicenceProductCardLink(tierInfo[tier]));
            }
        }
    }

    gotoLicenses() {
        window.location = "/Console/#licences-page";
    }
}