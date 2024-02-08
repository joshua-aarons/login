import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { CustomComponent } from "../CustomComponent.js";
import { signin, signup, signout, sendEmailVerification, sendForgotPasswordEmail } from "../Firebase/firebase.js";

useCSSStyle("login-page");
useCSSStyle("theme");


export class LoginPage extends CustomComponent {
    constructor(el = "login-page"){
        super(el)
        this.innerHTML = getHTMLTemplate("login")
        this.els = this.getElementLibrary();
        console.log(this.els);
        let {signinToggle, signupToggle, signinForm, signupForm, forgotPasswordForm1} = this.els;
        signinToggle.onclick = () => this.classList.remove("active");
        signupToggle.onclick = () => this.classList.add("active");

        signinForm.addEventListener("submit", () => this.signin());
        signinForm.addEventListener("forgot-password", () => {
            this.setAttribute("forgot-password", 1)});
        signupForm.addEventListener("submit", () => this.signup());
        forgotPasswordForm1.addEventListener("back", () => this.removeAttribute("forgot-password"));
        forgotPasswordForm1.addEventListener("submit", () => this.sendForgotPassword());


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
                this.signupError = e;
            }
        }
    }

    async sendForgotPassword(){
        let {email} = this.els.forgotPasswordForm1.value;
        sendForgotPasswordEmail(email);
        this.setAttribute("password-form", "2");
        
    }

    logout(){signout()}
    sendEmailVericiation(){sendEmailVerification()}

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