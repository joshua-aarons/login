import { TemplateLibrary } from "./template-library.js";
import { relURL } from "./utils.js";
let TemplateData = {};
let finishedLoading = null;
let Loading = new Promise((r) => {
    finishedLoading = r;
}); // Placeholder for loading state
// let CSSStyles = {};
export async function loadTemplates(loadAll = true) {
    console.log("%cLoading templates", "color: blue; font-weight: bold;");

    await Promise.all(Object.keys(TemplateLibrary).map(async key => {
        TemplateData[key] = {};
        let value = TemplateLibrary[key];
        await Promise.all(Object.keys(value).map(async type => {
            let path = value[type];
            let url = relURL("../" + path, import.meta);
            TemplateData[key][type] = await (await fetch(url)).text();
        }));
    }));

    for (let key in TemplateData) {
        if ("css" in TemplateData[key]) {
            let css = document.createElement("style");
            css.innerHTML = TemplateData[key]["css"];
            css.setAttribute("name", key);
            TemplateData[key]["css"] = css;
        }
    }
    finishedLoading();
    Loading = null;   
    console.log("%cTemplates loaded", "color: green; font-weight: bold;", TemplateData);
}

export function getHTMLTemplate(name) {
    let html = "";
    if (name in TemplateData && "html" in TemplateData[name]) {
        html = TemplateData[name]["html"]
    }
    return html;
}
export async function useCSSStyle(name){
    console.log(`%cUsing CSS style: ${name}`, "color: green; font-weight: bold;");

    if (Loading instanceof Promise) {
        await Loading;
    } 
    if (name in TemplateData && "css" in TemplateData[name]) {
        document.body.appendChild(TemplateData[name]["css"]);
        
    }
}
