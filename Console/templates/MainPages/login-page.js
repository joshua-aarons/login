import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import { CustomComponent } from "../../../Utilities/CustomComponent.js";
import { loadTemplates } from "../../../Utilities/template.js";
import {} from "../../../Utilities/templates/input-plus.js"
import { callFunction, GoogleAuthProvider, linkWithCredential, OAuthProvider, signInWithCustomToken, signInWithPopup } from "../../../Firebase/firebase-client.js";

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
        if (!error.startsWith("OTP:")) {
            isNewUser = true;
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
                console.log("linking", cred, result.user);
                
                let r = await linkWithCredential(result.user, cred);
                console.log("linking", r);
                
            }
        } catch (e) {
            console.log(e);
            
            error = e.message;
        }
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
        for (let m of [
            "otp-verify",
            "sign-in",
            "sign-up"
        ]) {
            
            this.els[m].classList.toggle("hide", mode !== m)
        }
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
        console.log("OPT:", otp);
        
        let error = await verifyOTP(this.els.email.value, otp);
        if (error) {
            this.els.otpError.innerText = error;
        }
        this.loading = false;
    }

    async requestOTP(email = this.els.email.value) {
        this.loading = true;
        this.overlayText = `Sending verifcation code`;
        let [isNewUser, error] = await requestOTP(email);
        if (isNewUser) {
            // this.els.otpError.innerText = error;
        } else if (error) {
            this.els.emailError.innerText = error;
        } else {
            this.resetOTPCountDown();
            this.mode = "otp-verify";
        }
        this.loading = false;
    } 

    async signInWithGoogle(){
        let provider = new GoogleAuthProvider();
        console.log("signing in with google");
        
        await this.signInWithProvider(provider);
    }

    async signInWithProvider(p) {
        this.loading = true;
        try {
            console.log(p);
            
            let res = await signInWithPopup(p);
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
            } else {
                console.log(error);
                
            }
        }
        this.loading = false;
    }

    async signInWithMicrosoft(){
        let provider = new OAuthProvider('microsoft.com');
        await this.signInWithProvider(provider);
    }

}