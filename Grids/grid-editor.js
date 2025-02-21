import { ShadowElement } from "../CustomComponent.js";
import { GridEditor } from "https://grids.squidly.com.au/GridCreator/grid-editor.js";
import { Icon } from "https://grids.squidly.com.au/Icons/icons.js";
import { SvgPlus } from "../SvgPlus/4.js";

class GridCreatorApp extends ShadowElement {
    constructor(el = "grid-creator-app"){
        super(el, "grid-root");
        this.gridEditor = new GridEditor();
        this.appendChild(this.gridEditor);
        this.load();
    }

    async load(){
        try {
            await Promise.all([
                this.loadStyles(),
                this.gridEditor.initialise(),
            ]);


            
            this.gridEditor.topicsList.children[0].remove();
            
        } catch (e) {
            console.log(e);
            
            let d1 = this.createChild("div", {class: "popup-promt", show:true});
            d1.createChild("div", {content: "Sorry, you are not authenticated and can not <br> use this app currently!"})
        }
      
    }
    static get usedStyleSheets() {return [
        "https://grids.squidly.com.au/GridCreator/grid-editor.css",
        "https://grids.squidly.com.au/GridCreator/grid.css",
    ]}
}

SvgPlus.defineHTMLElement(GridCreatorApp)