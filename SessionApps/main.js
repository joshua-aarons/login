import * as F from "../Firebase/firebase-client.js";
import { SvgPlus, UserDataComponent } from "../Utilities/CustomComponent.js";

/**
 * @typedef {Object} AppInfo
 * @property {string} name - The name of the app.
 * @property {string} title - The display title of the app.
 * @property {string} subtitle - A brief subtitle for the app.
 * @property {string} version - The current version of the app.
 * @property {string} description - A brief description of the app.
 * @property {string} icon - A URL to an icon representing the app.
 * @property {string} author - The URL where the app can be accessed.
 */

/**
 * @typedef {Object} AppDescriptor
 * @property {AppInfo} info - The metadata information about the app.
 * @property {string} html - The HTML content of the app's index page.
 */


/**
 * Fetches the app descriptor from the given URL, which includes both the app's metadata and its HTML content.
 * @param {string} url - The base URL where the app is hosted (e.g., "https://example.com/myapp").
 * @returns {Promise<AppDescriptor>} An object containing the app's metadata and HTML content.
 */
async function getAppDescriptor(url) {
    // Load index and info
    try {
        const [resInfo, resIndex] = await Promise.all([
            fetch(url + "/info.json", { cache: "no-store" }),
            fetch(url + "/index.html", { cache: "no-store" }),
        ]);
        
        const [info, html] = await Promise.all([
            resInfo.ok ? resInfo.json() : null,
            resIndex.ok ? resIndex.text() : null,
        ]);

        if (info) {
            const iconURL = new URL(info.icon, url)
            info.icon = iconURL.href;
        }
    
        return {info, html};
    } catch (error) {
        console.error("Error fetching app descriptor:", error);
        return {info: null, html: null};
    }
}

class AppIcon extends SvgPlus {
    constructor(app) {
        super("div");
        this.class = "app-card";
        let main = this.createChild("div", {class: "app-main"});
        if (app.info) {
            main.createChild("img", {class: "app-icon", src: app.info.icon});
            let info = main.createChild("div", {class: "app-info"});
            info.createChild("h2", {content: app.info.title});
            info.createChild("p", {content: app.info.subtitle});
        } else {
            main.createChild("h2", {content: "No Info"});
        }

        main.createChild("div", {content: app.url});
        this.createChild("button", {content:"delete", events: {
            click: async () => {
                await F.set(F.ref("apps/" + app.id), null);
            }
        }});
    }
}

class MainPage extends SvgPlus {
    #iconCache = {};
    constructor() {
        super("div");
        this.class = "main-page";
        this.createChild("h1", {content: "Session Apps"});
        this.appsList = this.createChild("div", {class: "apps-list"});

        let div = this.createChild("div", {class: "add-app"});
        let add = div.createChild("svg", {viewBox: "0 0 24 24", content: `<path fill="white" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />`});
        this.input = div.createChild("input", {type: "text", placeholder: "Add new app by URL (e.g. https://example.com/myapp)"});
        add.onclick = this.addApp.bind(this);
    }

    addApp() {
        let appURL = this.input.value.trim();
        const r = F.push(F.ref("apps"))
        F.set(r, {url: appURL});
    }

    set apps(apps) {
        this.#setApps(apps);
    }

    set admin(isAdmin) {
        this.toggleAttribute("no-admin", !isAdmin);
    }

    async #setApps(apps) {
        let data = await Promise.all(apps.map(a => getAppDescriptor(a.url)));
        data = data.map((d, i) => ({...apps[i], ...d}));
        this.appsList.innerHTML = "";
        for (let app of data) {
            if (app.id in this.#iconCache) {
                this.appsList.appendChild(this.#iconCache[app.id]);
            } else {
                let icon = new AppIcon(app);
                this.#iconCache[app.id] = icon;
                this.appsList.appendChild(icon);
            }
        }
    }

}

export { MainPage }