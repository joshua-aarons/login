import { SvgPlus } from "../SvgPlus/4.js"

class HoverPanel extends SvgPlus{
    constructor(icon){
        super('hover-panel');
        let removed = false;
        let fading = false;
        icon.hovering = true;
        let rel = this.createChild("div", {styles: {position: "relative"}});
        rel.innerHTML = icon.getAttribute('hover');
        rel.createChild("div", {class: "down-icon"});
        
        let next = () => {
            this.toggleAttribute("open", !fading)
            let bbox = icon.getBoundingClientRect()
            this.styles = {
                top: bbox.y + 'px',
                left: (bbox.x + bbox.width/2) + 'px',
                position: 'fixed'
            }
            if (!removed) window.requestAnimationFrame(next);
        }

        
        setTimeout(() => {
            let hoverDuration = parseFloat(window.getComputedStyle(this).transitionDuration);
            hoverDuration = Number.isNaN(hoverDuration) ? 300 : hoverDuration * 1000
            let id = setInterval(() => {
                let e = document.elementFromPoint(x,y)
                if (!e.isSameNode(icon) && !icon.contains(e)){
                    setTimeout(() => {
                        this.remove()
                        removed= true;
                    }, hoverDuration)
                    fading = true;
                    icon.hovering = false;
                    clearInterval(id)
                }
            }, hoverDuration);
            window.requestAnimationFrame(next);
        }, 60)

        

    }

}

const config = {childList: true, subtree: true}


let scheduledUpdate = false;
const onUpdate = (mutations) => {
    if (scheduledUpdate) return;
    scheduledUpdate = true;
    window.requestAnimationFrame(() => {
        let hoverIcons = document.querySelectorAll('[hover]')
        for (let icon of hoverIcons){
            if (!icon.hoverSet){
                icon.hoverSet = true
                addHoverListener(icon)
            }
        }
        scheduledUpdate = false;
    })
}

let x = -10
let y = -10

window.addEventListener('mousemove', (e) => {
    x = e.clientX
    y = e.clientY
})

function addHoverListener(icon){
    icon.addEventListener('mouseover', () => {
        if (!icon.hovering) {
            let hp = new HoverPanel(icon)
            document.body.appendChild(hp)
        }
    })
} 

const observer = new MutationObserver(onUpdate)

observer.observe(document.body, config)