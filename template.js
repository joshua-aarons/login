let html_templates = ["./templates/dashboard-components/meetings-page.html","./templates/dashboard.html","./templates/login.html","./templates/meeting-display.html","./templates/meeting-scheduler.html"];
let css_styles = ["./templates/input-plus.css","./templates/theme.css"];

let HTMLTemplates = {};
let CSSStyles = {};

for(let path of html_templates) {
    let html = await (await fetch(path)).text();
    let patha = path.replace("./templates/", "").replace(".html", "").split("/");
    HTMLTemplates[patha[patha.length-1]] = html;
}
for(let path of css_styles) {
    let css = await (await fetch(path)).text();
    let style = document.createElement("style");
    style.innerHTML = css;
    let patha = path.replace("./templates/", "").replace(".css", "").split("/");
    CSSStyles[patha[patha.length-1]] = style;
}
export function getHTMLTemplate(name) {
    let html = "";
    if (name in HTMLTemplates) {
        html = HTMLTemplates[name];
    }
    return html;
}
export function useCSSStyle(name){
    if (name in CSSStyles) {
        let style = CSSStyles[name];
        document.body.appendChild(style);
    }
}
