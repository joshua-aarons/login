import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { CustomComponent } from "../CustomComponent.js";
import { signin, signup, signout, sendEmailVerification, sendForgotPasswordEmail } from "../Firebase/New/accounts.js";

useCSSStyle("login-page");
useCSSStyle("theme");


export class LoginPage extends CustomComponent {
    constructor(el = "login-page"){
        super(el)
        this.innerHTML = getHTMLTemplate("login")
        this.els = this.getElementLibrary();
        const {signinForm, signupForm, forgotPasswordForm} = this.els;
        this.setAttribute("mode", "sign-in");

        signinForm.addEventListener("toggle", () => this.setAttribute("mode", "sign-up"));
        signinForm.addEventListener("submit", this.signin.bind(this));
        signupForm.addEventListener("toggle", () => this.setAttribute("mode", "sign-in"));
        signupForm.addEventListener("submit", this.signup.bind(this));
        signinForm.addEventListener("forgot-password", () => this.setAttribute("mode", "forgot-password"));
        forgotPasswordForm.addEventListener("submit", this.sendForgotPassword.bind(this));
        forgotPasswordForm.addEventListener("back", () => this.setAttribute("mode", "sign-in"));

        this.attachEvents();
    }

    async signinProvider(provider){
        signin(provider);
    }

    async signin(){
        let {signinForm} = this.els;
        signinForm.disabled = true;
        if (signinForm.validate()){
            try {
                console.log("HERE");
                await signin("email", signinForm.value);
                console.log("after");
            } catch (e) {
                console.log("error", e);
                
                this.signinError = e
            }
        }
        signinForm.disabled = false;

    }

    async signup(){
        let {signupForm} = this.els;
        signupForm.disabled = true;
        if (signupForm.validate()){
            try {
                await signup("email", signupForm.value);
                signupForm.value = "";
                this.emailVerify = true;
            } catch(e) {
                this.signupError = e;
            }
        }
        signupForm.disabled = false;
    }

    async sendForgotPassword(){
        let {email} = this.els.forgotPasswordForm1.value;
        sendForgotPasswordEmail(email);
        this.setAttribute("password-form", "2");

    }

    logout(){signout()}
    sendVerification(){sendEmailVerification()}

    closeEmailVerify(){
        this.emailVerify = false;
        this.logout();
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

    set signupError(error){
        console.log({error});
        if (error.inputName != "") {
            this.els.signupForm.getInput(error.inputName).error = error.message;
        }
    }
}