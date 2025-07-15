import { SvgPlus } from "../SvgPlus/4.js";

export class ElementCarousel extends SvgPlus {
    initialise() {
        let main = this.innerHTML;
        this.innerHTML = "";
        this.main = this.createChild("carousel-body", {content: main});
        this.acting = false;
        this.xv = 0;
        this.goal = null;
        this.selectedi = 0;
        this.direction = 1;
        let iconbox = this.createChild("div", {class: "icon-box"});
        let j = 0;
        this.icons = [...this.main.children].map(c => {
            let i = iconbox.createChild("span", {content: "●", style: {opacity: j++ == 0 ? 1 : 0.5}})
            const options = {
                root: this,
                threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
            };
            const observer = new IntersectionObserver((e) => {
                i.styles = {opacity: e[0].intersectionRatio *0.5 + 0.5};
            }, options);
            observer.observe(c);
            return i;
        })

        
        window.addEventListener("load", this.setNextTimeout(20000));
        
        let endAct = () => {
            mousedown = false;
            lastTouch = null;
            this.acting = false;
            this.setNextTimeout()
        }

        let moveAct = (dx, dy) => {
            if (Math.abs(dx/dy) > 2 ) {
                this.acting = true;
                this.goal = null;
                clearTimeout(this.nextID);
                this.xv = -dx;
                return true;
            }
            return false;
        }

        let mousedown = false;
        this.addEventListener("mousedown", (e) => {
            mousedown = true;
        });
        
        this.addEventListener("mousemove", (e) => {
            if (mousedown) {
                let dx = e.movementX;
                let dy = e.movementY;
                if (moveAct(dx, dy)) e.preventDefault();
            }
        });

        let lastTouch = null;
        this.addEventListener("touchmove", (e) => {
            let touch = e.touches[0];
            if (lastTouch !== null) {
                let dx = touch.clientX - lastTouch.clientX;
                let dy = touch.clientY - lastTouch.clientY;
                if (moveAct(dx, dy)) e.preventDefault();
            }
            lastTouch = touch;
        });

        
        this.addEventListener("mouseup", endAct);
        this.addEventListener("mouseleave", endAct);
        this.addEventListener("touchend", endAct);


        this.updateScroll();
    }

    onconnect() {
        if (!this.initialised) {
            this.initialised = true;
            this.initialise();
        }
    }


    get sx(){
        return this.main.scrollLeft;
    }
    set sx(x){
        if (x < 0) x = 0;
        if (x > this.main.scrollWidth) x = this.main.scrollWidth;
        this.main.scrollLeft = x;
    }


    setNextTimeout(time = 4000){
        clearTimeout(this.nextID)
        this.nextID = setTimeout(() => {
            if (this.goalI == this.main.children.length - 1 && this.direction == 1) this.direction = -1;
            if (this.goalI == 0 && this.direction == -1) this.direction = 1;
            this.goalI += this.direction;
            this.setNextTimeout(this.goalI == 0 ? 8000 : 4000);
        }, time)
    }
    
    getElementXPosition(el) {
        let x = 0;

        for (let element of this.main.children) {
            if (element.isSameNode(el)) {
                // x += element.clientWidth / 2;
                return x;
            } else {
                x += element.clientWidth;
            }
        }
        return null;
    }

    updateGoal(){
        let xpos = [...this.main.children].map(c => this.getElementXPosition(c));
        let mini = -1;
        let sx = this.sx;
        for (let i = 0; i < xpos.length; i++) {
            if (((xpos[i] >= sx && this.xv > 0) || (xpos[i] <= sx && this.xv <= 0)) && mini == -1) mini = i;
            if (((xpos[i] >= sx && this.xv > 0) || (xpos[i] <= sx && this.xv <= 0)) && Math.abs(xpos[i] - sx) < Math.abs(xpos[mini] - sx)) mini = i;
        }
        this.goal = xpos[mini];
        this.selectedi = mini;

        // let i = 0;
        // for (let icon of this.icons) icon.styles = {opacity: i++ == mini ? 1 : 0.5}
    }

    set goalI(i) {
        if (this.offsetParent != null) {
            i = i % this.main.children.length;
            let goal = this.getElementXPosition(this.main.children[i]);
            this.selectedi = i;
            this.goal = goal;
            // let j = 0;
            // for (let icon of this.icons) icon.styles = {opacity: j++ == i ? 1 : 0.5}
        }
    }
    get goalI(){return this.selectedi;}

    async updateScroll(){

        let minv = 0.5;
        let stop = false;
        while (!stop) {
            for (let el of this.main.children) {
                el.style.setProperty("--w", `${this.clientWidth}px`);
            }

            if (this.xv > 0) this.direction = 1;
            if (this.xv < 0) this.direction = -1;

            let vel =this.xv;
            this.xv *= 0.87;
            this.sx += vel;
            if (this.sx == 0 || this.sx == this.main.scrollWidth) this.xv = 0;
            if (!this.acting && this.xv < minv && this.goal == null) {
                this.updateGoal();
            }
            if (this.goal != null) {
                let dx = (this.goal - this.sx);
                let dir = dx > 0 ? 1 : -1;
                dx = dir * Math.sqrt(Math.abs(dx));
                // if (Math.abs(dx) < 1) dx = dx / Math.abs(dx);
                this.sx = this.sx + dx

                if (Math.abs(this.goal - this.sx) < 3) this.sx =this.goal;
            }
   
            await new Promise((resolve, reject) => {window.requestAnimationFrame(resolve)})
 
        }
    }
}


SvgPlus.defineHTMLElement(ElementCarousel);