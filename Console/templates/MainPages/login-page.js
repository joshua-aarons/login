import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import { CustomComponent } from "../../../Utilities/CustomComponent.js";
import { loadTemplates } from "../../../Utilities/template.js";
import {} from "../../../Utilities/templates/input-plus.js"
import { callFunction, forceAuthStateChange, getUser, GoogleAuthProvider, linkWithCredential, OAuthProvider, set, signInWithCustomToken, signInWithPopup } from "../../../Firebase/firebase-client.js";
import { delay } from "../../../Utilities/utils.js";
import { RouteQuery } from "../../../Utilities/router.js";

await loadTemplates();
useCSSStyle("input-plus")
useCSSStyle("login-page");
useCSSStyle("theme");



const OTP_RESEND_INTERVAL = 120; // seconds

let credential = null;
function retrievePendingCred() {
    return credential;
}


function savePendingCred(pendingCred) {
    credential = pendingCred;
    // localStorage.setItem("pendingCred", JSON.stringify(pendingCred));
}

async function requestOTP(email) {
    let res = (await callFunction("otp-getOTP", {email} )).data;
    let isNewUser = false;
    let error = null
    if (res.errors && res.errors.length > 0){
        error = res.errors[0];
        let isToSoon = error.startsWith("OTP");
        isNewUser = error.startsWith("NewUser");
        if (!isToSoon && !isNewUser) {
            error = "opt-FF: " + error
        } else {
            error = null;
        }
    }
    return [isNewUser, error];
}

async function verifyOTP(email, otp) {
    let res = (await callFunction("otp-checkOTP", {email, otp} )).data;
    
    let error = null
    if (res.errors && res.errors.length > 0){
        error = res.errors[0];
    } else {
        try {
            let result = await signInWithCustomToken(res.token);
            let cred = retrievePendingCred();
            if (cred) {
                try {
                    await linkWithCredential(result.user, cred);
                } catch (e) {
                    console.log("Error linking credential: ", e);
                }
            }
        } catch (e) {
            error = "sign in with token + link: " + e.message;
        }
    }
    return error
}

async function createAccountWithOTP(email, firstName, lastName) {
    let res = (await callFunction("otp-createAccountWithOTP", {
        email,
        firstName,
        lastName
    })).data;
    let error = null
    if (res.errors && res.errors.length > 0){
        error = "otp-FF: "+res.errors[0];
    }
    return error
}



export class LoginPage extends CustomComponent {
    constructor(el = "login-page"){
        super(el)
        let t = getHTMLTemplate("login-page")
        this.innerHTML = t;
        this.els = this.getElementLibrary();
        this.attachEvents();
        this.mode = "sign-in";
    }

    set loading(value) {
        this.toggleAttribute("loading", value);
        if (!value) this.els.overlayText.innerHTML = "";
    }
    set overlayText(text) {
        this.els.overlayText.innerHTML = text;
    }

    set mode(mode) {
        this.els.otpError.innerText = "";
        this.els.emailError.innerText = "";
        this.els.otpInput.value = "";
        if (mode === "sign-in") {
            this.els.email.value = "";
            credential = null;
        }
        for (let m of [
            "otp-verify",
            "sign-in",
            "sign-up"
        ]) {
            
            this.els[m].classList.toggle("hide", mode !== m)
        }
    }


    showOverlayError(error, action, actionpast) {
        let help = new RouteQuery("contact-page", {
            firstName: this.els.firstName.value || "",
            lastName: this.els.lastName.value || "",
            email: this.els.email.value,
            message: `I tried to ${actionpast}, but received the following error: \n"${error}".\nPlease assist.`
        });
        this.overlayText = `<span style="font-size:0.5em">An unexpected error occurred whilst ${action}.<br>"${error}"<br>Please contact <a href = "${window.origin + "/" + help}">support</a> or <a onclick = "window.location.reload();"> try again.</a></span>`;
    }
   
    resetOTPCountDown() {
        const {otpResend} = this.els;
        const otpVerify = this.els["otp-verify"];
        otpVerify.toggleAttribute("count-down", true);
        otpResend.innerText = `${Math.ceil(OTP_RESEND_INTERVAL / 60)}  minutes`;
        if (this.otpInterval) {
            clearInterval(this.otpInterval);
        }

        let time = OTP_RESEND_INTERVAL;
        this.otpInterval = setInterval(() => {
            if (time > 1) {
                time--;
                
                otpResend.innerText = time > 60 ? `${Math.ceil(time / 60)} minutes` : `${time}s`;
            } else {
                clearInterval(this.otpInterval);
                otpVerify.toggleAttribute("count-down", false);
            }
        }, 1000);
    }


    async verifyOTP() {
        this.loading = true;
        let otp = this.els.otpInput.value;
        let error = await verifyOTP(this.els.email.value, otp);
        let hide = true;
        if (error) {
            if (error.startsWith("OPT:")) {
                this.els.otpError.innerText = error.replace("OPT:", "").trim();
            } else {
                this.showOverlayError(error, "verifying your code", "verify my code");
                hide = false;
            }
        } else {
            if (getUser().emailVerified === false) { 
                await forceAuthStateChange();
            }
            await delay(1500)
        }
        if (hide) this.loading = false;
    }


    set email(email) {
        this.els.email.value = email;
    }
    

    async requestOTP(email = this.els.email.value) {
        this.loading = true;
        this.overlayText = `Sending verification code`;
        let [isNewUser, _, error] = await requestOTP(email);
        if (isNewUser) {
            this.mode = "sign-up";
            this.loading = false;
        } else if (error) {
            this.showOverlayError(error, "requesting a verification code", "request a verification code");
        } else {
            this.resetOTPCountDown();
            this.mode = "otp-verify";
            this.loading = false;
        }
    } 

    async createAccountWithOTP() {
        let {firstName, lastName} = this.els;
        if (firstName.validate() && lastName.validate()) {
            this.loading = true;
            this.overlayText = `Creating account...`;
            let error = await createAccountWithOTP(this.els.email.value, firstName.value, lastName.value);
            if (error){
                this.showOverlayError(error, "creating your account", "create an account using email");
            } else {
                this.mode = "otp-verify";
                this.loading = false;
            }
        }
    }

    async signInWithOTP() {
        let {email} = this.els;
        if (email.validate()) {
            await this.requestOTP(email.value);
        }
    }

    async signInWithGoogle(){
        let provider = new GoogleAuthProvider();
        await this.signInWithProvider(provider, "Google");
    }

    async signInWithMicrosoft(){
        let provider = new OAuthProvider('microsoft.com');
        await this.signInWithProvider(provider, "Microsoft");
    }

    async signInWithProvider(p, pname = "provider") {
        this.loading = true;
        let error = null;
        let res = null
        try {
            res = await signInWithPopup(p);
            await delay(1500)
        } catch (error) {
            console.log(error);
            
            // Users email already exists with a different auth provider.
            if (error.code === "auth/account-exists-with-different-credential") {

                console.log("User has signed in with a different provider.");
                
                const email = error.customData.email;
                const pendingCred = p.constructor.credentialFromError(error);
                
                // Step 3: Save the pending credential in temporary storage,
                savePendingCred(pendingCred);
                
                this.els.email.value = email;
                await this.requestOTP(email);
            } else if (error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-closed-by-user") {
                error = true;
                this.overlayText = "Authentication cancelled";
                await delay(1500)
                this.loading = false;
            } else {
                console.log(error)
                error = error.message;
            }
        }
        if (error) {
            if (typeof error === "string") {
                this.showOverlayError(error, `signing you in with your ${pname}`, `sign in with my ${pname}`);
            } 
        } else {
            await delay(1500)
            savePendingCred(p.constructor.credentialFromResult(res));
            this.loading = false;
        }
    }

}