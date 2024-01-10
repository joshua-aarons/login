import { SvgPlus, Vector } from "./SvgPlus/4.js";

class CustomComponent extends SvgPlus {
    getElementLibrary(){
        let els = {}
        for (let el of this.querySelectorAll("[name]")){
            let p = el.parentNode;
            let nested = false;
            while (!this.isSameNode(p)) {
                if (SvgPlus.is(p, CustomComponent)) {
                    nested = true;
                    break;
                } else {
                    p = p.parentNode;
                }
            }
            if (!nested) {
                els[el.getAttribute("name")] = el;
            }
        }
        return els;
    }
}

export {CustomComponent, Vector, SvgPlus}