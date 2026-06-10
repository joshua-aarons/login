import { SvgPlus } from "../../../../SvgPlus/4.js";
import { DiscreteHeatmap } from "../../../../Utilities/discreteHeatmap.js";
import { camelCaseToText, formatDateTime, formatMinutes, snakeCaseToText } from "../../../../Utilities/utils.js";

const mode2name = {
    "0": "Mouse",
    "1": "Eye Gaze"
}
const mode2subtitle = {
    "0": "Relative frequency of mouse cursor position",
    "1": "Relative frequency of eye gaze fixation"
}

class KeyValue extends SvgPlus {
    constructor(key, value) {
        super("div");
        this.class = "key-value";
        this.createChild("div", {class: "key", content: key});
        this.createChild("div", {class: "value", content: value});
    }
}

class ProgressBar extends SvgPlus {
    constructor(percent, barColor) {
        super("div");
        this.class = "progress-bar";
        this.fill = this.createChild("div", {class: "fill"});
        this.fill.style.width = percent + "%";
        if (barColor) {
            barColor = barColor.startsWith("--") ? `var(${barColor})` : barColor;
            this.fill.style.setProperty("--bar-color", barColor);
        }
    }
}

class BalanceCard extends SvgPlus {
    constructor(val1, val2, title = "Host / Participant Balance", subtitle = null) {
        super("div");
        this.class = "balance card";
        this.createChild("div", {class: "title", content: "Host / Participant Balance"});
        if (subtitle) {
            this.createChild("div", {class: "subtitle", content: subtitle});
        }

        let total = val1 + val2;
        let p1 = val1 / total * 100;
        let p2 = val2 / total * 100;
        let bar1 = this.createChild("div", {class: "bar host"}).createChild(ProgressBar, {styles: {
            background: "var(--aqua-green)",
            height: "0.6em",
            margin: "0.5em 0",
        }}, p1, "--blue");
        bar1.fill.style.borderRadius = "0";
        if (p2 > 0) {
            bar1.fill.style.borderRight = "2px solid white";
        }

        let row = this.createChild("div", {styles: {"display": "flex", "justify-content": "space-between"}})
        row.createChild("span", {
            styles: {color: "var(--blue)", "font-size": "0.8em"},
            content: "Host " + Math.round(p1) + "%"
        });
        row.createChild("span", {
            styles: {color: "var(--aqua-green)", "font-size": "0.8em"},
            content: "Participant " + Math.round(p2) + "%"
        });
    }
}

class BarGraph extends SvgPlus {
    constructor(entries) {
        super("div");
        this.class = "bar-graph";
        let nonZero = entries.filter(e => e.value > 0);
        let sum = nonZero.reduce((a, b) => a + b.value, 0);
        let n = nonZero.length;
        let legends = [];
        let bar = this.createChild("div", {class: "bar"});
        nonZero.forEach((e, i) => {
            let color = e.color || `hsl(${i / n * 360}, 70%, 50%)`;
            let segment = bar.createChild("div", {
                styles: {
                    background: color,
                    width: (e.value / sum * 100) + "%",
                }
            })
            legends.push([e.name, color]);
        })
        let legend = this.createChild("div", {class: "legend"});
        legends.forEach(([name, color]) => {
            let item = legend.createChild("div", {class: "legend-item"});
            item.createChild("div", {class: "legend-color", styles: {background: color}});
            item.createChild("span", {content: name});
        })
    }
}

const Key2Text = {
    "dwell": "eye gaze",
    "click": "mouse",
    "switch": "switch",
}

class InteractionCard extends SvgPlus {
    constructor(interactions) {
        super("div");
        this.class = "interactions card";
        this.createChild("div", {class: "title", content: "Interactions"});
        let totalInteractions = Object.values(interactions).reduce((a, b) => a + b, 0);
        let table = this.createChild("table").createChild("tbody");
        for (let key in interactions) {
            let value = interactions[key];
            let percent = totalInteractions > 0 ? (value / totalInteractions * 100) : 0;
            let row = table.createChild("tr");
            row.createChild("td", {class: "interaction-key", content: Key2Text[key] || key});
            let bar = row.createChild("td", {styles: {
                width: "100%",
            }}).createChild(ProgressBar, {}, percent, "--" + key + "-color");
            row.createChild("td", {class: "interaction-value", content: value});
        }
    }
}   

class HeatmapCard extends SvgPlus {
    constructor(mode, heatmapData) {
        super("div");
        this.class = "heatmap card";
        this.createChild("div", {class: "title", content: mode2name[mode] + " Heatmap"});
        this.createChild("div", {class: "subtitle", content: mode2subtitle[mode]});
        if (heatmapData) {
            let heatmap = DiscreteHeatmap.fromString(heatmapData);
            let svg = heatmap.getSVG(1.7, {
                width: 250,
                title: mode2name[heatmap.mode] + " Heatmap"
            });
            this.createChild("div", {class: "wrapper", content: svg});
        } else {
            this.createChild("div", {class: "no-data", content: "No heatmap data available"});
        }
    }
}

class AppView extends SvgPlus {
    constructor(appName, appData) {
        super("div");
        const users = ["host", "participant"]

        this.class = "app-view";
        
        let nInts = users.map(u => appData[u].interactions ? 
            Object.values(appData[u].interactions).reduce((a, b) => a + b, 0) : 0
        );

        if (nInts.some(i => i > 0)) {
            this.createChild(BalanceCard, {styles: {
                "grid-column-end": 3,
                "grid-column-start": 1
            }}, nInts[0], nInts[1]);
        }

        users.map(u => {
            let nInts = appData[u].interactions ? 
                Object.values(appData[u].interactions).reduce((a, b) => a + b, 0) : 0;

            let ut = this.createChild("div", {class: "s-row"});
            ut.createChild("span",{
                class: "user-type", 
                content: u.toUpperCase() + " DATA"
            });
            ut.createChild("span", {
                class: "word-tag", 
                [nInts > 0 ? "purple" : "gray"]: true,
                content: `${nInts} interactions`}
            );
        })

        users.map(u => this.createChild(
            InteractionCard, {}, 
            appData[u].interactions
        ))

        for (let mode of [0, 1]) {
            users.map(u => this.createChild(HeatmapCard, {}, 
                mode, appData[u].heatmaps ? appData[u].heatmaps[mode] : null
            ))
        }
    }
}

class OverviewView extends SvgPlus {
    constructor(sessionData) {
        super("div");
        this.class = "app-view";

        if (sessionData.deltas) {
            
            let dc = this.createChild("div", {class: "deltas card",
                styles: { "grid-column-end": 3, "grid-column-start": 1 }
            });

            let dd = sessionData.deltas.duration;
            dc.createChild("div", {content: "Duraction "}).createChild("span", {
                class: "word-tag",
                content: (dd > 0 ? "▲" : dd < 0 ? "▼" : "") + formatMinutes(Math.abs(dd)),
                [dd >= 0 ? "aqua-green" : "red"]: true,
            });

            let ti = sessionData.deltas.host.total + sessionData.deltas.participant.total;
            dc.createChild("div", {content: "Interactions "}).createChild("span", {
                class: "word-tag",
                content: (ti > 0 ? "▲" : ti < 0 ? "▼" : "") + Math.abs(ti),
                [ti >= 0 ? "aqua-green" : "red"]: true,
            });

            let pt = sessionData.deltas.participation;
            dc.createChild("div", {content: "Participation "}).createChild("span", {
                class: "word-tag",
                content: (pt > 0 ? "▲" : pt < 0 ? "▼" : "") + Math.abs(Math.round(pt*100)) + "%",
                [pt >= 0 ? "aqua-green" : "red"]: true,
            });

            let comparedTo = dc.createChild("div", {
                class: "compared-to",
                content: "vs " +formatDateTime(sessionData.deltas.comparedTo)[0],
            });
        }

        let sb = this.createChild("div", {class: "card",
            styles: { "grid-column-end": 3, "grid-column-start": 1 }
        });
        sb.createChild("div", {class: "title", content: "Session Breakdown"});
        sb.createChild(BarGraph, {}, sessionData.appsInfo.map(([appName, appData]) => {
            return {
                name: camelCaseToText(snakeCaseToText(appName)) + " <b>" + formatMinutes(appData.duration) + "</b>",
                value: appData.duration,
            }
        }))
        


        let ic = []
        let totals = {host: 0, participant: 0};
        for (let user of ["host", "participant"]) {
            let totalUserInteractions = {...sessionData.totals[user]}
            delete totalUserInteractions.total
            let totalInteractions = sessionData.totals[user].total || 0;
            
            ic.push(new InteractionCard(totalUserInteractions));
            let e = this.createChild("div", {class: "s-row"});
            e.createChild("span",{
                class: "user-type", 
                content: user.toUpperCase() + " DATA"
            });
            e.createChild("span", {
                class: "word-tag", 
                [totalInteractions > 0 ? "purple" : "gray"]: true,
                content: `${totalInteractions} interactions`}
            );
            totals[user] = totalInteractions;
        }
        ic.forEach(card => this.appendChild(card));

        let balanceCard = new BalanceCard(totals.host, totals.participant, "Overall Host / Participant Balance", "Based on total interactions across all apps");
        balanceCard.styles = { "grid-column-end": 3, "grid-column-start": 1 }
        sb.after(balanceCard);
    }
}

export class AppInfoPopup extends SvgPlus {
    constructor(sessionData) {
        super("div");

        const apps = sessionData.appsInfo || [];

        const d = new Date(sessionData.metadata.time);
        let date = d.toLocaleDateString(undefined, {month: "short", day: "2-digit", year: "numeric"});
        let time = d.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit", hour12: true});

        this.class = "app-info-popup";
        let header = this.createChild("div", {class: "header"})
        let title = header.createChild("div", {class: "title"});
        let maintitle = title.createChild("div", {class: "main", content: "Session Apps Info"});
        let subtitle = title.createChild("div", {class: "subtitle"});
        subtitle.createChild("i", {class: "fa-regular fa-calendar"})
        subtitle.createChild("span", {content: "&nbsp;" + date + "&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;"});
        subtitle.createChild("i", {class: "fa-regular fa-clock"})
        subtitle.createChild("span", {content: "&nbsp;" + time});
        
        let list = header.createChild("div", {class: "list"});
        let main = this.createChild("div", {class: "info-area"});

        let makeItem = (name, app, duration) => {
            let niceName = camelCaseToText(snakeCaseToText(name));
            let item = list.createChild("div", {class: "list-item", content: niceName});
            item.addEventListener("click", () => {
                main.innerHTML = "";
                main.appendChild(app);
                maintitle.innerHTML = niceName + "&nbsp;&nbsp;";
                maintitle.createChild("div", {class: "duration-tag",
                    styles: {"font-size": "0.65em"},
                    content: formatMinutes(duration)
                });
                [...list.children].forEach(child =>child.toggleAttribute("selected", child === item));
            });
            return item;
        }

        let overview = new OverviewView(sessionData);
        let item = makeItem("Overview", overview, sessionData.metadata.duration);

        let items = apps.map(([appName, appData]) => {
            let app = new AppView(appName, appData);
            makeItem(appName, app, appData.duration);
        });
        items.unshift(item);
        
       
        items[0].click();
    }
}

