import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { } from "../table-plus.js"

// let options = {}

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

// let options = {
//   series: [{
//     name: 'Sessions',
//     data: [3, 5, 4, 5, 7, 5, 4]
//   }, {
//     name: 'Minutes',
//     data: [75, 120, 100, 150, 100, 135, 100]
//   }],
//   yaxis: [
//     {
//       title: {
//         text: "Minutes"
//       },
//     },
//     {
//       opposite: true,
//       title: {
//         text: "Minutes"
//       }
//     }
//   ],
//   chart: {
//     height: 350,
//     type: 'area',
//     fontFamily: 'Poppins',
//     foreColor: 'var(--color-dark)',
//   },
//   dataLabels: {
//     enabled: false
//   },
//   stroke: {
//     curve: 'smooth'
//   },
//   xaxis: {
//     type: 'datetime',
//     // min: new Date('01 Jan 2024').getTime(),
//     // tickAmount: 6
//     categories: ["2024-01-05", "2024-01-12", "2024-01-19", "2024-01-26", "2024-02-02", "2024-02-09", "2024-02-16"],
//     labels: {
//       datetimeFormatter: {
//         year: 'yyyy',
//         month: 'MMM \'yy',
//         day: 'dd MMM',
//         hour: 'HH:mm'
//       }
//     }
//   }
//   // tooltip: {
//   //     x: {
//   //         format: 'dd mm yyyy'
//   //     },
//   // },
// };


class DashBoard extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("dash-board");
        let { sessions } = this.els;
        sessions.titleName = "<span class='row'>Recent Sessions <i class='fa-solid fa-circle-info' hover = 'recent sessions from the last 3 months'></i> </span>";
        sessions.getSortValue = cell => {
            let sv = cell.textContent.toLowerCase();
            if (cell.key == "date") sv = time(cell.value);
            return sv;
        }

        sessions.tools = [{
            icon: 'Details',
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
        }]
        sessions.headers = ["description", "date", "duration", "status"];
    }

    onvalue(value) {
        if (value.sessions) {
            // console.log(value)
            let series = []
            let series2 = []
            let xlabel = []
            // Quantised
            let today = new Date()
            let before = new Date()
            before.setMonth(today.getMonth() - 3)

            for (let i = time(before); i < time(today); i += 1000 * 60 * 60 * 24) {
                let tti = 0
                value.sessions.sort((a, b) => time(a.date) > time(b.date) ? 1 : -1)
                let tsc = 0
                for (let session of value.sessions) {
                    if (time(session.date) < i) {
                        tti += parseFloat(session.duration)
                        tsc ++ 
                    }
                }
                series.push(tti)
                series2.push(tsc)
                xlabel.push(i)
            }

            // Points
            // let tti = 0
            // value.sessions.sort((a,b) => time(a.sessionDate) > time(b.sessionDate) ? 1 : -1)
            // for (let session of value.sessions){
            //       tti += parseFloat(session.sessionLength)
            //       series.push(tti)
            //       xlabel.push(time(session.sessionDate))
            // }
            // console.log(series, xlabel);

            let options = {
                series: [{
                    name: 'Cumulative Minutes',
                    data: series,
                },
                {
                    name: 'Cumulative Sessions',
                    data: series2,
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
            console.log(options)
            if (this.chart)
                this.chart.updateOptions(options)
            else {
                if (this.els) {
                    this.chart = new ApexCharts(this.els.chart, options)
                    this.chart.render()
                }
            }
        }
    }
}



SvgPlus.defineHTMLElement(DashBoard);