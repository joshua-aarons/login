const IS_DEV = false; //true && window.location.origin.startsWith("http://127");
const URL = IS_DEV ? "http://127.0.0.1:5503/" : "https://grids.squidly.com.au"

let URL_GE = URL + "/GridCreator/grid-editor.js";
import { ShadowElement } from "../CustomComponent.js";
import { SvgPlus } from "../SvgPlus/4.js";

class GridCreatorApp extends ShadowElement {
    constructor(el = "grid-creator-app"){
        super(el, "grid-root");
        this.root.styles = {color: "black"}
        this.load();
    }

    async load(){
        const {GridEditor} = await import(URL_GE)
        this.gridEditor = new GridEditor();
        this.appendChild(this.gridEditor);
        try {
            await Promise.all([
                this.loadStyles(),
                this.gridEditor.initialise(),
            ]);
            
            
        } catch (e) {
            console.log(e);
            
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