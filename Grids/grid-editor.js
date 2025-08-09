const IS_DEV = false; //true && window.location.origin.startsWith("http://127");
const URL = IS_DEV ? "http://127.0.0.1:5503/" : "https://grids.squidly.com.au"

let URL_GE = URL + "/GridCreator/grid-editor.js";
import { ShadowElement, UserDataShadowElement } from "../Utilities/CustomComponent.js";
import { SvgPlus } from "../SvgPlus/4.js";

class GridCreatorApp extends UserDataShadowElement {
    constructor(el = "grid-creator-app"){
        super(el, "grid-root");
        this.root.styles = {color: "black"}
        this.load();
    }

    async load(){
        const {GridEditor} = await import(URL_GE)
        this.gridEditor = new GridEditor();

        this.gridEditor.editor.addEventListener("save",() => {
            if (!(this.value?.usage?.files?.remaining > 0)) {
                window.showNotification("You have reached the max quizes and grids.", 5000, "error");
            } else if (!(this.value?.maxTier > 0)) {
                window.showNotification("You will need a licence to edit grids.", 5000, "error");
            }
        })
        this.gridEditor.editor.addEventListener("add", () => {
            if (!(this.value?.maxTier > 0)) {
                window.showNotification("You will need a licence to save grids.", 5000, "error");
            }
        });
    
        this.appendChild(this.gridEditor);
        try {
            await Promise.all([
                this.loadStyles(),
                this.gridEditor.initialise(),
            ]);
            
        } catch (e) {
            
            let d1 = this.createChild("div", {class: "popup-promt", show:true});
            d1.createChild("div", {content: "Sorry, you are not authenticated and can not <br> use this app currently!"})
        }
      
    }
    static get usedStyleSheets() {return [
        "https://grids.squidly.com.au/GridCreator/grid-editor.css",
        "https://grids.squidly.com.au/GridCreator/grid.css",
        "https://grids.squidly.com.au/GridCreator/symbols.css",
        "https://grids.squidly.com.au/GridCreator/wb-inputs.css",
    ]}
}

SvgPlus.defineHTMLElement(GridCreatorApp)