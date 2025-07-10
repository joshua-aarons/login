const fs = require('node:fs');
const path = require('node:path');

function searchDirectory(dir, type) {
    let matches = [];
    let recurse = (d) => {
        // read the contents of the directory
        const files = fs.readdirSync(d);

        // search through the files
        for (const file of files) {
            // build the full path of the file
            const filePath = path.join(d, file);

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

function buildTemplateModule() {
    
    let library = {};
    for (let key of ["css", "html"]) {
        let templates = searchDirectory("./", key)
        templates = templates.filter(path => path.indexOf("templates") !== -1);

        templates.map(path => {
            let pathParts = path.replace("."+key, "").split("/");
            pathParts = pathParts.filter(n => n!="templates");
            
            let name = pathParts[pathParts.length - 1];
            if (!(name in library)) {
                library[name] = {};
            }

            library[name][key] = path.replace("./", "");
        })
    }

    let template_module = `export const TemplateLibrary = ${JSON.stringify(library, null, "\t")};`;
    fs.writeFileSync('./Utilities/template-library.js', template_module);

}
buildTemplateModule();