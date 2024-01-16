import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("login-page");

  // Validate Functions
  function validate_email(email) {
    let expression = /^[^@]+@\w+(\.\w+)+\w$/
    if (expression.test(email) == true) {
      return true
    } else {
      throw "Invalid email"
    }
}
  
function validate_password(password) {
    // Firebase only accepts lengths greater than 6
    if (password.length < 6) {
        throw "Password to short"
    } else {
        return true
    }
}

export class LoginPage extends CustomComponent {
    constructor(el = "login-page"){
        super(el)
        this.innerHTML = getHTMLTemplate("login")
        let {signinToggle, signupToggle, signinForm, signinBtn, signupForm, signupBtn} = this.getElementLibrary()
        signinToggle.onclick = () => this.classList.remove("active");
        signupToggle.onclick = () => this.classList.add("active");

        for (let form of [signinForm, signupForm]) {
            form.getInput("email").validater = validate_email;
            form.getInput("password").validater = validate_password;
        }

        signinBtn.onclick = () => {
            const event = new Event("signin")
            if (signinForm.validate()){
                event.data = signinForm.value
                this.dispatchEvent(event)
            }
        }

        signupBtn.onclick = () => {
            const event = new Event("signin")
            if (signupForm.validate()){
                event.data = signupForm.value
                this.dispatchEvent(event)
            }
        }
    }
}