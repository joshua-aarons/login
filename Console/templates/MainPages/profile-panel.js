import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { resetPassword } from "../../../Firebase/accounts.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { } from "../../../Utilities/templates/input-plus.js"; 


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
        
        this.setupEventListeners();

        // passwordReset.attachEvents()
        // passwordReset.getInput("oldpasscode").validater = validate_password;
        // passwordReset.getInput("newpasscode").validater = validate_password;
        // passwordReset.getInput("confirmpasscode").validater = (cp) => {
        //     if (passwordReset.getInputValue("newpasscode") != cp) {
        //         throw "Confirm passcode must be the same"
        //     } else {
        //         return true;
        //     }
        // }
        // passwordReset.addEventListener("submit", () => {
        //     this.updatePasscode()
        // });
    }

    setupEventListeners() {
        // Navigation items
        this.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const route = navItem.dataset.route;
                if (route) {
                    this.handleNavigation(route);
                }
            }
        });

        // User avatar click
        this.addEventListener('click', (e) => {
            const userAvatar = e.target.closest('.user-avatar');
            if (userAvatar) {
                this.handleNavigation('profile');
            }
        });
    }

    handleNavigation(route) {
        // Check if we're in Dashboard window (not inside app-view)
        const isDashboardWindow = document.body.classList.contains('dashboard-window');
        
        if (isDashboardWindow) {
            // In Dashboard window, find dashboard-welcome and call its handleNavigation
            const dashboardWelcome = document.querySelector('dashboard-welcome');
            if (dashboardWelcome && typeof dashboardWelcome.handleNavigation === 'function') {
                dashboardWelcome.handleNavigation(route);
            }
        } else {
            // In Console window, use app-view
            if (window.appView) {
                window.appView.panel = route === 'dashboard' ? 'dashboard-welcome' : route;
            }
        }
        
        // Update active nav item in profile-panel
        const navItems = this.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.route === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
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
            // this.els.passwordReset.reset()
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