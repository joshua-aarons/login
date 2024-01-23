import { SvgPlus } from "../CustomComponent.js"

class HoverPanel extends SvgPlus{
    constructor(icon){
        super('hover-panel')
        this.innerHTML = icon.getAttribute('hover')
        let bbox = icon.getBoundingClientRect()
        this.styles = {
            top: bbox.y + 'px',
            left: bbox.x + 'px',
            position: 'fixed'
        }
        let id = setInterval(() => {
            let e = document.elementFromPoint(x,y)
            if (!e.isSameNode(icon) && !icon.contains(e)){
                this.remove()
                clearInterval(id)
            }
        }, 300)
    }

}

const config = {childList: true, subTree: true}

const onUpdate = (mutations) => {
    let hoverIcons = document.querySelectorAll('[hover]')
    for (let icon of hoverIcons){
        if (!icon.hoverSet){
            icon.hoverSet = true
            addHoverListener(icon)
        }
    }
}

let x = -10
let y = -10

window.addEventListener('mousemove', (e) => {
    x = e.clientX
    y = e.clientY
})

function addHoverListener(icon){
    icon.addEventListener('mouseover', () => {
        let hp = new HoverPanel(icon)
        document.body.appendChild(hp)
    })
} 

const observer = new MutationObserver(onUpdate)

observer.observe(document.body, config)