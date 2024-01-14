import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("login-page");

export class LoginPage extends CustomComponent {
    constructor(el = "login-page"){
        super(el)
        this.innerHTML = getHTMLTemplate("login")
        let {signinToggle, signupToggle, signinForm, signinBtn} = this.getElementLibrary()
        signinToggle.onclick = () => this.classList.remove("active")
        signupToggle.onclick = () => this.classList.add("active")
        signinBtn.onclick = () => {
            const event = new Event("signin")
            if (signinForm.validate()){
                event.data = signinForm.value
                this.dispatchEvent(event)
            }
        }
    }
}