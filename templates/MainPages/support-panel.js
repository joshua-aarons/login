import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { sendSupportMessage } from "../../Firebase/firebase.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class SupportPanel extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("support-panel");
        let form = this.querySelector("form-plus");
        form.loading = false;
        form.addEventListener("submit", async () => {
            if (form.validate()) {
                form.loading = true;
                await sendSupportMessage(form.value, (p) => {
                    form.loading = p
                })
                form.loading = "You're support message </br> has been sent.";
                form.value = null;
                setTimeout(() => {
                    form.loading = false;
                }, 1500)
            }
            console.log(form.value);
        }) 
    }
}

SvgPlus.defineHTMLElement(SupportPanel);