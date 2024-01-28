import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { loadCSV } from "../table-plus.js"


useCSSStyle("theme");

class AdminControl extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("admin-control");
        let style = this.createChild('style')
        let email = 'joshua.aarons@ymail.com'
        style.innerHTML = `tr[email='${email}'] td[key='tool'] {opacity: 0.5; pointer-events: none;}`
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
                method: "deleteRow"
            }
            // {
            //     icon: `<i class="fa-solid fa-pencil"></i>`, 
            //     name: "delete", 
            //     method: "deleteRow"
            // }
        ]
        members.headers = ["id", "name", "email", "status"]
       

        update.addEventListener("click", async () => {
            let csv = await loadCSV()
            // check format 
            // update database
            let parsedCSV = []
            for (let i = 0; i < csv.length && i <= 25; i++){
                parsedCSV.push(csv[i])
            }
            members.value = parsedCSV;

        })

        download.addEventListener("click", () => {
            let link = new SvgPlus("a")
            link.props = { href: "./templates/template-members-page.csv" };
            link.toggleAttribute("download", true)
            link.click()
        })
    }
    onvalue(value){
        if (value.members) {
            console.log(value)
            value.memberscount = value.members.length
            value.memberspercent = value.members.length / 25
        }
    }
}

SvgPlus.defineHTMLElement(AdminControl);