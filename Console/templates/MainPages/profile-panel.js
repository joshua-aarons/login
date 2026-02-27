import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { } from "../../../Utilities/templates/input-plus.js"; 


useCSSStyle("theme");


class ProfilePanel extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("profile-panel");
        let els = this.els;
        let {info} = els;

        info.addEventListener("submit", () => {
            if (info.validate()){
                this.updateUserData(info.value)
            }
        })

        els.uploadDP.onclick = () => this.openimage()
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

}

SvgPlus.defineHTMLElement(ProfilePanel);