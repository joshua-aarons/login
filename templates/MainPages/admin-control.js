import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { loadCSV } from "../table-plus.js"


useCSSStyle("theme");

class AdminControl extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("admin-control");
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
            },
            {
                icon: `<i class="fa-solid fa-pencil"></i>`, 
                name: "delete", 
                method: "deleteRow"
            }
        ]
        members.headers = ["id", "name", "email", "status"]
       

        update.addEventListener("click", async () => {
            let csv = await loadCSV()
            // check format 
            // update database
            members.value = csv;
        })

        download.addEventListener("click", () => {
            let link = new SvgPlus("a")
            link.props = { href: "./templates/template-members-page.csv" };
            link.toggleAttribute("download", true)
            link.click()
        })
    }
}

SvgPlus.defineHTMLElement(AdminControl);