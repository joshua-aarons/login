import {SvgPlus} from "./SvgPlus/4.js"
class InputPlus extends SvgPlus {
    onconnect(){
        let {input} = this;
        input.addEventListener("focus", () => {
            this.classList.add("focus");
            this.classList.add("not-empty");
        });
        input.addEventListener("blur", () => {
            if(this.value == "") {
                this.classList.remove("not-empty"); 
            };
            this.classList.remove("focus");
        });

        input.addEventListener("change", (e) => {
            this.dispatchEvent(new Event(e));
        });
    }

    get name(){
        let name = this.input.getAttribute("name");
        if (!name) name = this.getAttribute("name");
        return name
    }
    get required(){
        let required = this.input.hasAttribute("required");
        if (!required) required = this.hasAttribute("required");
        return required
    }

    get input(){
        return this.querySelector("input, select, textarea");
    }

    get value(){
        return this.input.value;
    }

    set value(value){
        this.input.value = value;
        if (value == "") {
            this.classList.remove("not-empty"); 
        } else {
            this.classList.add("not-empty"); 
        }
    }
}

SvgPlus.defineHTMLElement(InputPlus);