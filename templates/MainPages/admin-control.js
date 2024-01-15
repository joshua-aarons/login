import { CustomComponent, SvgPlus } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class AdminControl extends CustomComponent {
    onconnect(){
        this.innerHTML = getHTMLTemplate("admin-control");
        let els = this.getElementLibrary()
        els.update.addEventListener("click", () => {
            els.members.loadcsv()
        })
        els.searchbar.addEventListener("input", () => {
            els.members.search(els.searchbar.value)
        })
        els.toPDF.addEventListener("click", () => {
            els.members.convertPDF()
        })
        els.download.addEventListener("click", () => {
            let link = new SvgPlus("a") 
            link.props = {href:"./templates/template-members-page.csv"};
            link.toggleAttribute("download", true)
            link.click()
        })
        els.toCSV.addEventListener("click", () => {
            els.members.convertCSV()
        })
    }

}

SvgPlus.defineHTMLElement(AdminControl);