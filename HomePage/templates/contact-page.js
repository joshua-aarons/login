import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../Utilities/template.js";
import {} from "../../../Utilities/templates/input-plus.js";
import { push, ref, set } from "../../Firebase/firebase-client.js";

useCSSStyle("input-plus");
export class ContactPage extends UserDataComponent {
     constructor() {
        super("contact-page");
        this.template = getHTMLTemplate("contact-page");
        const {form} = this.els;
        form.getInput("message").validater = (value) => {
            if (value.length == "") {
                throw "Message cannot be empty";
            } else if (value.length > 255) { 
                throw `Message to long, ${value.length}/500 characters`;
            }
            return true;
        }
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (form.validate()) {
                let formData = this.els.form.value;
                formData.users = parseInt(formData.users);              
                set(push(ref("contact-messages")), formData);
                form.reset();
            }
        })
    }

    gotoLicenses() {
        window.location = "/Console/#licences-page";
    }
}