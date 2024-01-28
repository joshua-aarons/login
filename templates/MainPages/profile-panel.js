import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js";
import { } from "../input-plus.js"; 
import { resetPassword } from "../../Firebase/firebase.js";

useCSSStyle("theme");

function validate_password(password) {
    // Firebase only accepts lengths greater than 6
    if (password.length < 6) {
        throw "Password should be at least 6 characters"
    } else {
        return true
    }
}

class ProfilePanel extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("profile-panel");
        let els = this.els;
        let {details, passwordReset} = els;
        let elsdetail = details.getElementLibrary();
        let elspr = passwordReset.getElementLibrary();
        elsdetail.update.onclick = () => {
            if (details.validate()){
                this.updateUserData(details.value)
                this.dispatchEvent(new Event('updateDetails'))
            }
        }
        els.uploadDP.onclick = () => this.openimage()
        details.attachEvents()
        passwordReset.attachEvents()
        passwordReset.getInput("oldpasscode").validater = validate_password;
        passwordReset.getInput("newpasscode").validater = validate_password;
        passwordReset.getInput("confirmpasscode").validater = (cp) => {
            if (passwordReset.getInputValue("newpasscode") != cp) {
                throw "Confirm passcode must be the same"
            } else {
                return true;
            }
        }

        elspr.update.onclick = () => {
            this.updatePasscode()
        }

    }
    onvalue(value) {
        this.els.details.value = value
    }
    async openimage() {
        let input = new SvgPlus("input")
        input.props = {type:"file",accept:"image/*"}
        let image = await new Promise((resolve, reject) => {
            input.addEventListener("change", e => {
                if (input.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        resolve(evt.target.result);
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            })
            input.click()
        })
        this.updateUserData({displayPhoto: image})
    }
    onhide() {
        this.els.details.reset()
        this.els.passwordReset.reset()

    }
    async updatePasscode() {
        let {passwordReset} = this.els;
        if (passwordReset.validate()) {
            try {
                let data = passwordReset.value;
                await resetPassword(data);
                passwordReset.reset();
                alert('Password has been updated') 
            } catch(e) {
                if (e.errorCode = "auth/wrong-password")
                    passwordReset.getInput("oldpasscode").error = "Password incorrect"
            }
        }
    }
}

SvgPlus.defineHTMLElement(ProfilePanel);