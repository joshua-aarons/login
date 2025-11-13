import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import { } from "../../../Utilities/templates/table-plus.js"


useCSSStyle("theme");
function time(date) {
    if (!date) return 0;
    if (date instanceof Date)
        return (date.getTime())
    if (date.indexOf("/") != -1) {
        let [day, month, year] = date.split("/");
        return (new Date(`${year}/${month}/${day}`)).getTime();
    }
    return (new Date(date)).getTime()
}

function cumsum(arr) {
    let result = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        if (i === 0) {
            result[i] = arr[i];
        } else {
            result[i] = result[i - 1] + arr[i];
        }
    }
    return result;
}

function apexChartsOptions(s1, s2, xlabel) {
    return {
        series: [{
            name: 'Cumulative Minutes',
            data: s1,
        },
        {
            name: 'Cumulative Sessions',
            data: s2,
        }],
        xaxis: {
            type: 'datetime',
            categories: xlabel,
            labels: {
                datetimeFormatter: {
                    year: 'yyyy',
                    month: 'MMM \'yy',
                    day: 'dd MMM',
                    hour: 'HH:mm'
                }
            }
        },
        yaxis: [
            {
                title: {
                    text: "Minutes"
                },
            },
            {
                opposite: true,
                title: {
                    text: "Sessions"
                }
            }
        ],
        chart: {
            height: 350,
            type: 'area',
            fontFamily: 'Poppins',
            foreColor: 'var(--color-dark)',
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        }
    }
}

class DashBoard extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("dash-board");
        let { sessions } = this.els;
        sessions.titleName = "<span class='row'>Recent Sessions <i class='fa-solid fa-circle-info' hover = 'recent sessions from the current and future quarters'></i> </span>";
        sessions.getSortValue = cell => {
            let sv = cell.textContent.toLowerCase();
            if (cell.key == "date") sv = time(cell.value);
            return sv;
        }
        sessions.tools = [{
                icon: '<i class="fa-regular fa-file-lines"></i>',
                name: 'details',
                method: (cell) => {
                    document.querySelector('app-view').displayMeeting(cell.parentNode.value)
                }
            },
            {
                icon: `<span class="material-symbols-outlined">content_copy</span>`, 
                name: "delete", 
                method: async (cell) => {
                    let link = cell.parentNode.value.link
                    await navigator.clipboard.writeText(link)
                    let o = 0
                    let id = setInterval( () => {
                        cell.style.setProperty('opacity', Math.cos(o)*0.5+0.5)
                        if (o > 2*Math.PI)
                            clearInterval(id)
                        o += 0.3
                    }, 30)
                }
            },
            {
                icon: '<i class="fa-regular fa-circle-play"></i>',
                name: 'start',
                method: (cell) => {
                    let value = cell.parentNode.value;
                    window.open(value.link);
                }
            }
        ]
        sessions.headers = ["description", "date", "duration", "status"];
        this.con = true;
    }

    ondisconnect(){
        console.log("disconected");
        this.con = false;
        this.chart.destroy();
        // this.els.chart = new SvgPlus("div");
        // this.els.chartContainer.appendChild(this.els.chart);
        this.chart = null;
    }

    onvalue(value) {
        let noSessions = true;
        if (value.sessions) {
            let sessions = [...value.sessions];
            if (sessions.length > 0) noSessions = false;

            // Get the current quarter start and end date
            let qStart = new Date()
            let m1 = Math.floor(qStart.getMonth() / 3) * 3;
            qStart.setMonth(m1)
            qStart.setDate(1);
            qStart.setHours(0);
            qStart.setMinutes(0);

            let qEnd = new Date(qStart+"");
            qEnd.setMonth(m1 + 3);
            
            // Ensure sessions are sorted by time
            sessions.sort((a, b) => a.time - b.time);

            let getDay = (time) =>  Math.round(time / (1000 * 60 * 60 * 24));

            // Create a map of sessions by day
            let sessionsByDay = {};
            for (let session of sessions) {
                let day = getDay(session.time);
                if (!sessionsByDay[day]) {
                    sessionsByDay[day] = [];
                }
                sessionsByDay[day].push(session);
            }

            // Compute cumulative minutes and sessions per day
            let sessionCountPerDay = [];
            let sessionDurationPerDay = [];
            let labels = [];
            let lastCount = 0;
            let lastDuration = 0;
            for (let day = getDay(qStart); day <= getDay(qEnd); day++) {
                if (sessionsByDay[day]) {
                    let sessionsToday = sessionsByDay[day];
                    lastCount += sessionsToday.length;
                    lastDuration += sessionsToday.reduce((sum, session) => sum + session.duration, 0);
                } 
                sessionCountPerDay.push(lastCount);
                sessionDurationPerDay.push(lastDuration);
                labels.push(day * 24 * 60 * 60 * 1000); // Convert day to timestamp
            }

            let options = apexChartsOptions(sessionDurationPerDay, sessionCountPerDay, labels);

            if (this.chart)
                this.chart.updateOptions(options)
            else {
                if (this.con) {
                    this.chart = new ApexCharts(this.els.chart, options)
                    this.chart.render()
                }
            }
        }
        
        this.toggleAttribute("no-sessions", noSessions)
    }
}



SvgPlus.defineHTMLElement(DashBoard);