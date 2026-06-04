import { SvgPlus } from "../../../../SvgPlus/4.js";
import { DiscreteHeatmap } from "../../../../Utilities/discreteHeatmap.js";
import { formatMinutes } from "../../../../Utilities/utils.js";

const mode2name = {
    "0": "Mouse",
    "1": "Eye Gaze"
}

class KeyValue extends SvgPlus {
    constructor(key, value) {
        super("div");
        this.class = "key-value";
        this.createChild("div", {class: "key", content: key});
        this.createChild("div", {class: "value", content: value});
    }
}

class AppUserDataView extends SvgPlus {
    constructor(user, data) {
        super("div");
        this.class = "user-data-view";
        this.createChild("div", {class: "user-type", content: user});
        let main = this.createChild("section");
        let dataTable = main.createChild("div", {class: "data"});

        let totalInteractions = Object.values(data.interactions).reduce((a, b) => a + b, 0);
        dataTable.createChild(KeyValue, {styles: {"font-weight": "bold"}}, "Interactions", totalInteractions);
        for (let key in data.interactions) {
            let value = data.interactions[key];
            if (value > 0)
                dataTable.createChild(KeyValue, {styles: {"margin-left": "1em"}}, key, data.interactions[key]);
        }

        for (let mode of [0, 1]){
            console.log(data.heatmaps, mode);
            let heatmap = data.heatmaps ? data.heatmaps[mode] : null;
            let svg = "";
            if (heatmap) {
                heatmap = DiscreteHeatmap.fromString(heatmap);
                svg = heatmap.getSVG(1, {
                    width: 250,
                    title: mode2name[heatmap.mode] + " Heatmap"
                });
            }
            main.createChild("div", {class: "heatmap-container", content: svg});
        }
    }
}

class AppView extends SvgPlus {
    constructor(appName, appData) {
        super("div");
        this.class = "app-view";
        let t = this.createChild("div", {class: "app-title"});
        t.createChild("div", {class: "app-name", content: appName});
        t.createChild("div", {class: "app-duration", content: formatMinutes(appData.duration)});
        this.createChild(AppUserDataView, {}, "Host Data", appData.host);
        this.createChild(AppUserDataView, {}, "Participant Data", appData.participant);
    }
}

export class AppInfoPopup extends SvgPlus {
    constructor(apps) {
        super("div");
        this.class = "app-info-popup";
        let list = this.createChild("div", {class: "list"});
        let main = this.createChild("div", {class: "info-area"});
        let items = apps.map(([appName, appData]) => {
            let app = new AppView(appName, appData);
            let item = list.createChild("div", {class: "list-item", content: appName});
            item.addEventListener("click", () => {
                main.innerHTML = "";
                main.appendChild(app);
                [...list.children].forEach(child =>child.toggleAttribute("selected", child === item));
            });
            return item;
        });
        items[0].click();
    }
}

