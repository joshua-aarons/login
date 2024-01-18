const fs = require('node:fs');
const folderPath = './templates';


function searchDirectory(dir, type) {
    let matches = [];
    let recurse = (d) => {
        // read the contents of the directory
        const files = fs.readdirSync(d);

        // search through the files
        for (const file of files) {
            // build the full path of the file
            const filePath = d + "/" + file;

            // get the file stats
            const fileStat = fs.statSync(filePath);

            // if the file is a directory, recursively search the directory
            if (fileStat.isDirectory()) {
                recurse(filePath, file);
            } else if (file.endsWith(type)) {
                // if the file is a match, print it
                matches.push(filePath);
            }
        }
    }
    recurse(dir);
    return matches;
}

let html_templates = searchDirectory("./templates", ".html");
let css_styles = searchDirectory("./templates", ".css");

let template_module = `let html_templates = ${JSON.stringify(html_templates)};
let css_styles = ${JSON.stringify(css_styles)};

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
`

fs.writeFile('./template.js', template_module, err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });