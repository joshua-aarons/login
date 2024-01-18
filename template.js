let html_templates = ["./templates/MainPages/admin-control.html","./templates/MainPages/dash-board.html","./templates/MainPages/data-and-privacy.html","./templates/MainPages/meetings-panel.html","./templates/MainPages/profile-panel.html","./templates/MainPages/support-panel.html","./templates/MeetingTools/meeting-display.html","./templates/MeetingTools/meeting-scheduler.html","./templates/app-view.html","./templates/login.html"];
let css_styles = ["./templates/MeetingTools/meeting-display.css","./templates/app-view.css","./templates/input-plus.css","./templates/login-page.css","./templates/members-plus.css","./templates/theme.css"];

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
    style.setAttribute("name", patha[patha.length-1]);
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
