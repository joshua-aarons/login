import { SvgPlus } from "../../../../SvgPlus/4.js";
import { InteractivePlot } from "../../../../Utilities/Plots/interactive-plot.js";
import { formatMinutes } from "../../../../Utilities/utils.js";

const PLOT_W = 700;
const PLOT_H = 210;

// Each metric defines a title, y-axis label, and one or more data series to extract.
const METRICS = [
    {
        title: "Session Duration",
        shortTitle: "Duration",
        yLabel: null,
        yFormat: formatMinutes,
        series: [
            { label: "", color: "#3b82f6", extractor: s => s.metadata?.duration ?? null },
        ],
    },
    {
        title: "Interactions per Session",
        shortTitle: "Interactions",
        yLabel: null,
        yFormat: v => Math.round(v) == v ? v.toFixed(0) : "",
        avgFormat: v => Math.round(v) + "",
        series: [
            { label: "Host",        color: "#2e9e5b", extractor: s => (s.totals?.host?.total && s.totals?.participant?.total) ? s.totals?.host?.total ?? null : null },
            { label: "Participant", color: "#7380ec", extractor: s => (s.totals?.host?.total && s.totals?.participant?.total) ? s.totals?.participant?.total ?? null : null},
        ],
        avgExtractor:  s => ((s.totals?.host?.total ?? 0) + (s.totals?.participant?.total ?? 0)),
    },
    {
        title: "AAC Words Used",
        shortTitle: "AAC Words",
        yLabel: null,
        series: [
            { label: "", color: "#f59e0b", extractor: s => s.aac?.length ?? 0 },
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
                color: "#8b5cf6",
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
        this._delta = this.createChild("div", { class: "summary-stat-delta" });
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
        this._delta.innerHTML = ""; // Clear previous delta

        // Delta vs first session value
        if (points.length >= 2) {
        
            const first = extractor(points[0]);
            const diff  = avg - first;
            if (diff !== 0) {
                const pos     = diff > 0;
                const badge   = this._delta.createChild("span", { class: "summary-stat-badge" });
                badge.toggleAttribute("positive", pos);
                badge.toggleAttribute("negative", !pos);
                badge.innerHTML = (pos ? "▲ " : "▼ ") + formatter(Math.abs(diff));
                this._delta.createChild("span", { class: "summary-stat-vs", content: "vs first session" });
            }
        }
    }
}

class TrendCard extends SvgPlus {
    constructor(metric) {
        super("div");
        this.class = "trend-card";

        let header = this.createChild("div", { class: "trend-card-header" });
        header.createChild("div", { class: "trend-card-title", content: metric.title });

        this._plotWrap = this.createChild("div", { class: "trend-card-plot-wrap" });
        this._empty   = this.createChild("div", { class: "trend-card-empty", content: "Not enough data variation to display trend" });

        this._plot = new InteractivePlot(null);
        this._plot.size   = [PLOT_W, PLOT_H];
        this._plot.xTime  = true;
        if (metric.yLabel) this._plot.yLabel = metric.yLabel;
        this._plotWrap.appendChild(this._plot);

        this._metric = metric;
    }

    update(sessions) {
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
                    { stroke: s.color, strokeWidth: 4},
                    0,
                    multiSeries ? s.label : ""
                );
                added++;
            }
        });
        this._plot.xLabel = null;
        this._plot.setYLabel(this._metric.yLabel);
        if (this._metric.yFormat) this._plot.setYFormat(this._metric.yFormat);

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

        // Build a flat list of { card, series, metric } for the summary row
        let srow = this.createChild("div", { class: "summary-stats-row" });
        this._summaryCards = METRICS.map(m => srow.createChild(StatSummaryCard, {}, m))
        
        // for (const m of METRICS) {
        //     const fmt = m.yFormat || (v => v.toFixed(1));
        //     this._summaryCards.push(thi)
        //     for (const s of m.series) {
        //         const label = m.series.length > 1 ? `Avg ${s.label} ${m.title}` : `Avg ${m.title}`;
        //         const card  = this._summaryRow.createChild(StatSummaryCard, {}, label, s.color);
        //         this._summaryCards.push({ card, extractor: s.extractor, fmt });
        //     }
        // }

        this.createChild("p", {
            class: "trends-intro",
            content: "Scroll to zoom  ·  Drag to pan  ·  Double-click to reset",
        });
        this._cards = METRICS.map(m => this.createChild(TrendCard, {}, m));
    }

    set logs(sessionLogs) {
        if (typeof sessionLogs !== "object" || sessionLogs === null) sessionLogs = {};

        const sessions = Object.values(sessionLogs)
            .filter(s => s?.metadata?.time != null)
            .sort((a, b) => a.metadata.time - b.metadata.time);

        this._summaryCards.forEach(card => card.update(sessions));
        this._cards.forEach(card => card.update(sessions));
    }
}
