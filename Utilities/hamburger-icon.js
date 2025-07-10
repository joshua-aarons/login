import { SvgPlus } from "./CustomComponent.js";

class HamburgerIcon extends SvgPlus {
    constructor(el = "hamburger-icon") {
        super(el);
    }
    onconnect() {
        this.styles = {
            display: "content"
        }
        this.svg = this.createChild("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 32 32",
        });
        this.lines = new Array(3).fill(0).map((_, i) => 
            this.svg.createChild("path", {
                d: `M4,${i*8 + 8}h24`,
                "stroke-width": "3.5",
                "stroke-linecap": "round",
                "fill": "none",
            })
        );
    }


    onclick() {
        this.animate_one();
    }


    async animate_one() {
        this.direction = !this.direction;
        // const t1 = 5;
        const w = 3;
        let pointsF = (t, t1, top = false) => {
            let tt = top ? 24 : 8;
            let tmid = top ? 24 - t * 8 : 8 + t * 8;
            let xs = 4 + t * w;
            let xe = 28 - t * w;
            return "M" + [
                [xs, tt], 
                [
                    [xs, tt],
                    [16-t1, tmid],
                    [16, tmid],
                ],
                [
                    [16+t1,tmid],
                    [xe, tt],
                    [xe, tt],
                ]
            ].map((p) => p.flat().join(",")).join("C")
        };

        const duration = 500;
        let time = 0;
        let t0 = performance.now();
        let t2point = 0.75;
        while (time <= duration*1.1) {
            time = performance.now() - t0;
            let t = time / duration;
            if (t > 1) t = 1;

            if (!this.direction) {
                t = 1 - t;
            }

            let t3 = (1 - Math.cos(t * Math.PI)) / 2; // Smooth transition for the middle line
            let points = [
                [4 + 12 * t3, 16], 
                [28 - 12 * t3, 16],
            ]
            this.lines[1].setAttribute("d", "M"+points.join("L"));


            let t1 = t < t2point ? t/t2point : 1; 
            let t2 = t > t2point ? (t - t2point)/(1 - t2point) : 0;
            t2 = 1 - t2;


            t1 = t1 ** (this.direction ? 0.3 : 3);
            t2 = t2 ** (this.direction ? 3 : 0.3);

            console.log(t1, t2, t3, t);
            

            this.lines[0].setAttribute("d", pointsF(t1, 7*t2));
            this.lines[2].setAttribute("d", pointsF(t1, 7*t2, true));
            time += 16.67; // Roughly 60 FPS
            await new Promise(resolve => setTimeout(resolve, 16.67));
        }
        
        // this.waveTransition((t) => {
            
        // }, 800, this.direction)
        // if (this.direction) {
        //     await this.waveTransition((t) => {
        //         this.lines[0].setAttribute("d", pointsF(t, 7));
        //         this.lines[2].setAttribute("d", pointsF(t, 7, true));
        //     }, 500, true)
        //     await this.waveTransition((t) => {
        //         this.lines[0].setAttribute("d", pointsF(1, t*7));
        //         this.lines[2].setAttribute("d", pointsF(1, t*7, true));
        //     }, 300, false)
        // } else {
        //     await this.waveTransition((t) => {
        //         this.lines[0].setAttribute("d", pointsF(1, t*7));
        //         this.lines[2].setAttribute("d", pointsF(1, t*7, true));
        //     }, 300, true)
        //     await this.waveTransition((t) => {
        //         this.lines[0].setAttribute("d", pointsF(t, 7));
        //         this.lines[2].setAttribute("d", pointsF(t, 7, true));
        //     }, 500, false)
        // }
    }
}

SvgPlus.defineHTMLElement(HamburgerIcon)