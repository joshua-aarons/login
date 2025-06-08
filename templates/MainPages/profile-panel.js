import { SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { resetPassword } from "../../Firebase/New/accounts.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js";
import { } from "../input-plus.js"; 


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
        let {info, passwordReset} = els;

        info.addEventListener("submit", () => {
            if (info.validate()){
                this.updateUserData(info.value)
            }
        })

        els.uploadDP.onclick = () => this.openimage()


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
        passwordReset.addEventListener("submit", () => {
            this.updatePasscode()
        });
    }
  
    async openimage() {
        let input = new SvgPlus("input")
        input.props = {type:"file",accept:"image/*"}
        let image = await new Promise((resolve, reject) => {
            input.addEventListener("change", e => {
                if (input.files.length > 0) {
                    // const reader = new FileReader();
                    // reader.onload = (evt) => {
                    //     resolve(evt.target.result);
                    // };
                    // reader.readAsDataURL(input.files[0]);
                    resolve(input.files[0])
                }
            })
            input.click()
        })
        if (image.size > 5*1024*1024){
            alert('display photo to large')
        }else {
            this.updateDisplayPhoto(image)
        }


    }
    onhide() {
        if (this.els) {
            this.els.info.reset()
            this.els.passwordReset.reset()
        }

    }
    async updatePasscode() {
        let {passwordReset} = this.els;
        if (passwordReset.validate()) {
            passwordReset.loading = true;
            try {
                let data = passwordReset.value;
                await resetPassword(data);
                passwordReset.reset();
                passwordReset.loading = "Password has successfuly </br> been updated!";
                setTimeout(() => passwordReset.loading = false, 2000)
            } catch(e) {
                if (e.errorCode = "auth/wrong-password")
                    passwordReset.getInput("oldpasscode").error = "Password incorrect"

                passwordReset.loading = false;
            }
        }
    }
}

SvgPlus.defineHTMLElement(ProfilePanel);