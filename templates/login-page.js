import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { CustomComponent } from "../CustomComponent.js";
import { signin, signup, signout, sendEmailVerification } from "../Firebase/firebase.js";

useCSSStyle("login-page");


export class LoginPage extends CustomComponent {
    constructor(el = "login-page"){
        super(el)
        this.innerHTML = getHTMLTemplate("login")
        this.els = this.getElementLibrary();
        console.log(this.els);
        let {signinToggle, signupToggle, signinForm, signupForm} = this.els;
        signinToggle.onclick = () => this.classList.remove("active");
        signupToggle.onclick = () => this.classList.add("active");

        signinForm.addEventListener("submit", () => this.signin());
        signupForm.addEventListener("submit", () => this.signup());

        this.attachEvents();
    }

    async signin(){
        let {signinForm} = this.els;
        if (signinForm.validate()){
            try {
                console.log("HERE");
                await signin("email", signinForm.value);
                console.log("after");
            } catch (e) {
                this.signinError = e
            }

        }
    }

    async signup(){
        let {signupForm} = this.els;
        if (signupForm.validate()){
            try {
                await signup("email", signupForm.value);
                signupForm.value = "";
                this.emailVerify = true;
            } catch(e) {
                console.log(e);
            }
        }
    }

    logout(){signout()}
    sendEmailVericiation(){sendEmailVerification()}

    closeEmailVerify(){
        this.emailVerify = false;
    }

    set emailVerify(bool){
        this.els.emailVerify.classList.toggle("open", bool);
    }

    set signinError(error){
        console.log(error);
        if (error.inputName != "") {
            this.els.signinForm.getInput(error.inputName).error = error.message;
        }
    }

    

}