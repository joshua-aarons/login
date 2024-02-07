import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { addAdminListener, updateAdminUsers } from "../../Firebase/firebase.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { loadCSV } from "../table-plus.js"


useCSSStyle("theme");

class AdminControl extends UserDataComponent {
    onconnect() {
        addAdminListener((v) => this.onAdminData(v));
        this.template = getHTMLTemplate("admin-control");
        this.style_el = this.createChild('style')
        
        let { members, update, download } = this.els;

        members.titleName = "Members";
        members.parseValue = (value) => {
            let i = 1;
            for (let v of value) v.id = i++;
            return value;
        }
        members.tools = [
            {
                icon: `<i class="fa-solid fa-trash"></i>`, 
                name: "delete", 
                method: (cell) => {
                    members.deleteRow(cell)
                    this.update()
                }
            }
        ]
        members.headers = ["id", "name", "email", "status"]
       

       

        download.addEventListener("click", () => {
            let link = new SvgPlus("a")
            link.props = { href: "./templates/template-members-page.csv" };
            link.toggleAttribute("download", true)
            link.click()
        })

        this.attachEvents();
    }
    onvalue(value){
        // if (value.members) {
        //     console.log(value)
        //     value.memberscount = value.members.length
        //     value.memberspercent = value.members.length / 25
        // }
        console.log(value);
        if (value && value.info && value.info.email) {
            let {email} = value.info;
            this.email = email;
            this.style_el.innerHTML = `tr[email='${email}'] td[key='tool'] {opacity: 0.5; pointer-events: none;}`
        }
    }
    

    onAdminData(v) {
        if (v.users) {
            this.els.members.value = v.users;
        }
    }


    hideInvalidCSVPopup(){
        this.els.invalidCSVPopup.classList.remove("open")
    }

    update(){
        updateAdminUsers([...this.els.members.tbody.children].map(x => x.value))
    }

    async loadCSVAdmins(){
        const maxUsers = 25;
        const validStatus = {"admin": true, "staff": true};
        let {members, invalidCSVPopup, errorCSV} = this.els;
        const exp = /^[^@]+@\w+(\.\w+)+\w$/

        invalidCSVPopup.classList.remove("open")

        let csv = await loadCSV()
        // check format 
        // update database
        let parsedCSV = [{
            email: this.email,
            name: this.value.info.displayName,
            status: "admin",
        }]
        let error = false;
        if (csv.length <= maxUsers) {
            for (let i = 0; i < csv.length; i++){
                let {name, email, status} = csv[i];
                console.log(status);
                if (!name || !email || !status) {
                    error = "The table is missing the required fields."
                } else {
                    if (!exp.test(email)) {
                        error = `The email <i>'${email}'</i> on row ${i+2} is invalid.`
                    }
                    
                    status = status.toLowerCase();
                    if (!(status in validStatus)) {
                        error = `The status <i>'${status}'</i> on row ${i+2} is not a valid status (admin/staff).`
                    }
                }
    
                if (error) {
                    break;
                } else {
                    if (email != this.email) {
                        parsedCSV.push({name, email, status})
                    }
                }
            }
        } else {
            error = `This table has ${csv.length} rows but only ${maxUsers} are allowed.`
        }
        if (error) {
            errorCSV.innerHTML = error;
            invalidCSVPopup.classList.add("open");
        }

        updateAdminUsers(parsedCSV);
        members.value = parsedCSV;
    }
}

SvgPlus.defineHTMLElement(AdminControl);