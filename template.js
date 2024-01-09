let templates = {}
for(let name of ["dashboard", "login", "meeting-scheduler", "meeting-display"]) {
    templates[name] = await (await fetch(`./templates/${name}.html`)).text();
}

export {templates}

