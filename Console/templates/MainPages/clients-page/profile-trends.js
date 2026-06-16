import { SvgPlus } from "../../../../SvgPlus/4.js";
import { InteractivePlot } from "../../../../Utilities/Plots/interactive-plot.js";
import { formatMinutes } from "../../../../Utilities/utils.js";

const PLOT_W = 300 * 1.5;
const PLOT_H = 200 * 1.5;

// Each metric defines a title, y-axis label, and one or more data series to extract.
const METRICS = [
    {
        title: "Session Duration",
        shortTitle: "Duration",
        yLabel: null,
        yFormat: (v) => v >= 0 ? formatMinutes(v) : "",
        maxTickValue: 133 * 60 + 33, // "1 hr 5 min" — representative longest label for formatMinutes
        series: [
            { label: "", color: "#7380ec", extractor: s => s.metadata?.duration ?? null },
        ],
    },
    {
        title: "Interactions per Session",
        shortTitle: "Interactions",
        yLabel: null,
        yFormat: v => Math.round(v) == v ? v.toFixed(0) : "",
        avgFormat: v => Math.round(v) + "",
        series: [
            { label: "Total", color: "rgb(246 180 61)", extractor:  s => (s.totals?.host?.total && s.totals?.participant?.total) ? ((s.totals?.host?.total ?? 0) + (s.totals?.participant?.total ?? 0)) : null },
            { label: "Participant", strokeDasharray: "2 8", color: "rgb(16, 185, 129)", extractor: s => (s.totals?.host?.total && s.totals?.participant?.total) ? s.totals?.participant?.total ?? null : null},
            { label: "Host",        strokeDasharray: "2 8", color: "rgb(59, 130, 246)", extractor: s => (s.totals?.host?.total && s.totals?.participant?.total) ? s.totals?.host?.total ?? null : null },
        ],
    },
    {
        title: "AAC Words Used",
        shortTitle: "AAC Words",
        yLabel: null,
        series: [
            { label: "Total", color: "#8f53c9", extractor: s => s.aac?.length ?? 0 },
            { label: "Participant", strokeDasharray: "2 8", color: "rgb(16, 185, 129)", extractor: s => (s.aac || []).filter(([w, isHost]) => !isHost).length},
            { label: "Host", strokeDasharray: "2 8", color: "rgb(59, 130, 246)", extractor: s => (s.aac || []).filter(([w, isHost]) => isHost).length},
        ],
        avgFormat: v => Math.round(v) + "",
        yFormat: v => Math.round(v) == v ? v.toFixed(0) : "",
    },
    {
        title: "Participation",
        yLabel: null,
        yFormat: v => v.toFixed(1) + "%",
        series: [
            {
                label: "",
                color: "#ff7782",
                extractor: s => {
                    const p = s.totals?.participation;
                    return typeof p === "number" && p > 0 ? (p * 100) : null;
                },
            },
        ],
    },
];

/** Returns true only if there is at least one Y value that differs from the first. */
function hasVariation(points) {
    if (points.length < 2) return false;
    const first = points[0][1];
    return points.some(([, y]) => y !== first);
}

/** Single summary stat card shown in the top row. */
class StatSummaryCard extends SvgPlus {
    constructor(metric) {
        super("div");
        this.class = "summary-stat-card";
        this.style.setProperty("--stat-color", metric.series[0].color);
        this._label = this.createChild("div", { class: "summary-stat-label", content: "Avg. " + (metric.shortTitle || metric.title) });
        this._value = this.createChild("div", { class: "summary-stat-value", content: "—" });
        // this._delta = this.createChild("div", { class: "summary-stat-delta" });
        this._metric = metric;
    }

    update(points) {
        let average = "—";
        let avg = null;
        const extractor = this._metric.avgExtractor || this._metric.series[0].extractor;
        const formatter = this._metric.avgFormat || this._metric.yFormat || (v => v.toFixed(1));
        if (points && points.length > 0) {
            let values = points.map(extractor).filter(p => p !== null)
            let sum = values.reduce((a, b) => a + b, 0);
            let n = values.length;
            avg = n > 0 ? sum / n : null;
            average = (avg !== null && !Number.isNaN(avg)) ? formatter(avg) : "—";
        }
        this._value.innerHTML = average;
        // this._delta.innerHTML = ""; // Clear previous delta

        // // Delta vs first session value
        // if (points.length >= 2) {
        
        //     const first = extractor(points[0]);
        //     const diff  = avg - first;
        //     if (diff !== 0) {
        //         const pos     = diff > 0;
        //         const badge   = this._delta.createChild("span", { class: "summary-stat-badge" });
        //         badge.toggleAttribute("positive", pos);
        //         badge.toggleAttribute("negative", !pos);
        //         badge.innerHTML = (pos ? "▲ " : "▼ ") + formatter(Math.abs(diff));
        //         this._delta.createChild("span", { class: "summary-stat-vs", content: "vs first session" });
        //     }
        // }
    }
}

class TrendCard extends SvgPlus {
    constructor(metrics) {
        super("div");
        this.class = "trend-card";

        let header = this.createChild("div", { class: "trend-card-header" });
        header.createChild("div", { class: "trend-card-title", content: "Session Trends" });
        this._selector = header.createChild("div", { class: "trend-selector" });
        this._selectorBtns = metrics.map((m, i) => {
            const btn = this._selector.createChild("button", {
                class: "trend-selector-btn",
                content: m.shortTitle || m.title,
            });
            btn.addEventListener("click", () => this._selectMetric(i));
            return btn;
        });

        this._plotWrap = this.createChild("div", { class: "trend-card-plot-wrap" });
        this._empty   = this.createChild("div", { class: "no-data", content: "Not enough data variation to display trend" });

        this._plot = new InteractivePlot(null);
        this._plot.size   = [PLOT_W, PLOT_H];
        this._plot.xTime  = true;
        this._plotWrap.appendChild(this._plot);

        this.createChild("p", { class: "trends-intro", content: "Scroll to zoom  ·  Drag to pan  ·  Double-click to reset </br> Cmd/Ctrl + scroll to stretch" });

        this._metrics = metrics;
        this._sessions = [];
        this._selectMetric(0);
    }



    _selectMetric(index) {
        this._selectorBtns.forEach((btn, i) => btn.toggleAttribute("active", i === index));
        this._metric = this._metrics[index];
        this._plot.xLabel = null;
        this.update(this._sessions);
    }

    update(sessions) {
        this._sessions = sessions || [];
        this._plot.clearSeries();

        if (!sessions || sessions.length < 2) {
            this._showEmpty("Not enough sessions to display trend");
            return;
        }

        const multiSeries = this._metric.series.length > 1;
        let added = 0;

        this._metric.series.forEach((s) => {
            const points = sessions
                .map(sess => [sess.metadata.time, s.extractor(sess)])
                .filter(([, y]) => y !== null);

            if (hasVariation(points)) {
                this._plot.addSeries(
                    points,
                    { stroke: s.color, strokeWidth: 4, strokeDasharray: s.strokeDasharray || null },
                    0,
                    multiSeries ? s.label : ""
                );
                added++;
            }
        });
        this._plot.xLabel = null;
        this._plot.setYLabel(this._metric.yLabel);
        if (this._metric.yFormat) this._plot.setYFormat(this._metric.yFormat);
        this._plot.setYMaxTick(this._metric.maxTickValue ?? null);

        if (added === 0) {
            this._showEmpty("No variation in data across sessions");
        } else {
            this._plotWrap.style.display = "";
            this._empty.style.display   = "none";
        }
    }

    _showEmpty(msg) {
        this._empty.innerHTML          = msg;
        this._plotWrap.style.display   = "none";
        this._empty.style.display      = "";
    }
}

export class ProfileSessionTrends extends SvgPlus {
    constructor() {
        super("div");
        this.class = "profile-session-trends";

        // Summary stat row
        let srow = this.createChild("div", { class: "summary-stats-row" });
        this._summaryCards = METRICS.map(m => srow.createChild(StatSummaryCard, {}, m));

        // Single card with selector + plot inside
        this._card = this.createChild(TrendCard, {}, METRICS);
    }

    set logs(sessionLogs) {
        if (typeof sessionLogs !== "object" || sessionLogs === null) sessionLogs = {};

        const sessions = Object.values(sessionLogs)
            .filter(s => s?.metadata?.time != null)
            .sort((a, b) => a.metadata.time - b.metadata.time);

        this._summaryCards.forEach(card => card.update(sessions));
        this._card.update(sessions);
    }
}
