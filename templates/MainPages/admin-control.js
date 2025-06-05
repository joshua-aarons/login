import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { addAdminListener, removeAdminUser, updateAdminUsers } from "../../Firebase/firebase.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { loadCSV } from "../table-plus.js"


useCSSStyle("theme");

class AdminControl extends UserDataComponent {
    onconnect() {
        addAdminListener((v) => this.onAdminData(v));
        this.template = getHTMLTemplate("admin-control");
        this.style_el = this.createChild('style')
        
        let { members, download } = this.els;

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
                    removeAdminUser(cell.parentNode.value.email);
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
        if (value && value.info && value.info.email) {
            let {email} = value.info;
            this.email = email;
            this.displayName = value.info.displayName ? value.info.displayName : value.info.firstName;

            this.style_el.innerHTML = `tr[email='${email}'] td[key='tool'] {color: rgba(115, 128, 236, 0.5); pointer-events: none;}`
        }
    }
    

    onAdminData(v) {
        console.log(v);
        
        let mcount = 0;
        let seats = 0;
        if (v.users) {
            this.els.members.value = v.users;

            mcount = v.users.length;
        }
        if (v.seats) seats = v.seats;
        this.els.maxUserInfo.setAttribute("hover", `A total of <b>${mcount}</b> users out of <b>${seats}</b> maximum users.`)

        this.value = {memberscount: mcount, memberspercent: seats == 0 ? 0 : mcount/seats}
    }


    hideInvalidCSVPopup(){
        this.els.invalidCSVPopup.classList.remove("open")
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
            name: this.displayName,
            status: "admin",
        }]
        let error = false;
        if (csv.length <= maxUsers) {
            for (let i = 0; i < csv.length; i++){
                let {name, email, status} = csv[i];
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
        } else {
            updateAdminUsers(parsedCSV);
            members.value = parsedCSV;
        }

    }
}

SvgPlus.defineHTMLElement(AdminControl);