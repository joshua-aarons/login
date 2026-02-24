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

/**
 * Requests an OTP for the given email. If the email is new, returns isNewUser = true.
 * In this case, the user should be prompted to create an account.
 * If an error occurs, then the error string is returned.
 * 
 * @param {string} email 
 * @returns {Promise<[boolean, string]>} isNewUser, error
 */
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

/**
 * Verifies the given OTP for the given email. If successful, signs in the user.
 * If an error occurs, then the error string is returned.
 * 
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<string>} error
 */
async function verifyOTP(email, otp) {
    // Call firebase function to verify OTP and get custom token
    let res = (await callFunction("otp-checkOTP", {email, otp} )).data;
    
    let error = null
    // If the results from the function contains errors
    if (res.errors && res.errors.length > 0){
        // return the first error
        error = res.errors[0];
    } else {
        try {
            // Sign in with the custom token from the function result
            let result = await signInWithCustomToken(res.token);

            // If there is a pending credential from a provider sign in, link it to the user's account
            let cred = retrievePendingCred();
            if (cred) {
                try {
                    await linkWithCredential(result.user, cred);
                } catch (e) {
                    console.log("Error linking credential: ", e);
                }
            }

        // Catch any errors that occur during sign in or linking and return them
        } catch (e) {
            error = "sign in with token + link: " + e.message;
        }
    }
    return error
}

/**
 * Creates an account with the given email, first name, and last name.
 * If an error occurs, then the error string is returned.
 * 
 * @param {string} email
 * @param {string} firstName
 * @param {string} lastName
 * @returns {Promise<string>} error
 */
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

/**
 * Verify specified email.
 * 
 */
async function forceEmailVerification(email) {
    let res = (await callFunction("otp-verifyEmail")).data

    let error = null
    if (res.errors && res.errors.length > 0){
        error = "otp-FF: "+res.errors[0];
    }
    return error
}


const ForceSignInWithMicrosoftEmails = [
    "cerebralpalsy.org.au"
]
function checkEmailIsFromDomain(email, domain) {
    if (typeof email !== "string" || typeof domain !== "string") return false;

    const e = email.trim().toLowerCase().replace(/\.+$/, "");
    const d = domain.trim().toLowerCase().replace(/^\@+/, "").replace(/\.+$/, "");

    return e.endsWith(d)
}
function isEmailFromDomains(email, domains) {
    return domains.some(domain => checkEmailIsFromDomain(email, domain));
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
        // Validate the OTP input
        if (this.els.otpInput.validate()) {

            // Get the OTP value from the input and call the verifyOTP function
            let otp = this.els.otpInput.value;
            let error = await verifyOTP(this.els.email.value, otp);

            let hide = true;
            if (error) {
                // If there was an error verifying the OTP, show it on the overlay
                if (error.startsWith("OPT:")) {
                    this.els.otpError.innerText = error.replace("OPT:", "").trim();
                } else {
                    this.showOverlayError(error, "verifying your code", "verify my code");
                    hide = false;
                }
            } else {
                // If the users email is not verified, force a refresh of 
                // the auth state to update the emailVerified property
                if (getUser().emailVerified === false) { 
                    await forceAuthStateChange();
                }
                await delay(1500)
            }
        
            if (hide) this.loading = false;
        } else {
            this.els.otpError.innerText = "Invalid code";
            this.loading = false;
        }
    }

    set email(email) {
        this.els.email.value = email;
    }

    async requestOTP(email = this.els.email.value) {
        if (isEmailFromDomains(email, ForceSignInWithMicrosoftEmails)) {
            await this.signInWithMicrosoft();
        } else {
            this.loading = true;
            this.overlayText = `Sending verification code`;
            let [isNewUser, error] = await requestOTP(email);
            console.log(isNewUser, error)
            if (isNewUser) {
                this.mode = "sign-up";
                this.loading = false;
            } else if (error) {
                switch (error) {
                    case "opt-FF: Email domain is not allowed.":
                        this.overlayText = "";
                        this.signInWithMicrosoft();
                        break;
    
                    default:
                        this.showOverlayError(error, "requesting a verification code", "request a verification code");
                        break;
                }
            } else {
                this.resetOTPCountDown();
                this.mode = "otp-verify";
                this.loading = false;
            }
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
                this.resetOTPCountDown();
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
        provider.setCustomParameters({
            prompt: "select_account"   // tells Microsoft to always show account chooser
        });
        await this.signInWithProvider(provider, "Google");
    }

    async signInWithMicrosoft(){
        let provider = new OAuthProvider('microsoft.com');
        provider.setCustomParameters({
            prompt: "select_account"   // tells Microsoft to always show account chooser
        });
        await this.signInWithProvider(provider, "Microsoft");
    }

    async signInWithProvider(p, pname = "provider") {
        this.overlayText = "";
        this.loading = true;

        let providerError = null;
        let res;
        let userEmail;
        try {
            res = await signInWithPopup(p);
        } catch (error) {
            
            // Users email already exists with a different auth provider.
            if (error.code === "auth/account-exists-with-different-credential") {
                console.warn("User has signed in with a different provider.");

                // Save the credential they used to sign in
                const pendingCred = p.constructor.credentialFromError(error);
                savePendingCred(pendingCred);
                
                // Request the user to sign in with a one time password
                userEmail = error.customData.email;

                // If the email is from a domain that we force to sign in with Microsoft, 
                // show an error message instead of requesting OTP.
                if (isEmailFromDomains(userEmail, ForceSignInWithMicrosoftEmails)) {
                    providerError = `It looks like your ${pname} account is registered with a provider that is now blocked for your email.`;
                
                // Otherwise, request OTP for the email so they can link their provider account to their existing account.
                } else {
                    this.els.email.value = userEmail;
                    await this.requestOTP(userEmail);
                }
            } else if (error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-closed-by-user") {
                // User cancelled the sign in process.
                console.warn("User cancelled the popup.");
                providerError = true;
                this.loading = false;

            } else {
                // Some other error occurred.
                console.warn("Some unforseen sign in with provider error", error)
                providerError = error.message;
            }
        }

        // If there was an error with the provider sign in, show it on the overlay. 
        if (providerError && typeof error === "string") {
            this.showOverlayError(error, `signing you in with your ${pname}`, `sign in with my ${pname}`);

        // Otherwise, if sign in was successful, save the credential for later linking and hide the overlay.
        } else if (!providerError) {
            // If the users email is not verified and is from a domain that we force to sign in with Microsoft.
            await delay(1500)
            savePendingCred(p.constructor.credentialFromResult(res));
            this.loading = false;
        }
    }


    async onEmailNeedsVerification({email}) {
        if (isEmailFromDomains(email, ForceSignInWithMicrosoftEmails)) {
            this.loading = true;
            let res = await forceEmailVerification(email);
            console.log("force email verification result: ", res)
            if (res) {
                this.showOverlayError(res, "verifying your email", "verify my email");
            } else {
                await forceAuthStateChange();
            }
            this.loading = false;
        } else {
            this.email = email;
            await this.requestOTP(email);
        }
    }
}