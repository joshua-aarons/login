import { CustomComponent, SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"

useCSSStyle("theme");

class DashBoard extends UserDataComponent {
    onconnect(){
        this.template = getHTMLTemplate("dash-board");
        this.chart = new ApexCharts(this.els.chart, options)
        this.chart.render()
    }
    // onvalue(value){
    //     let series = []
    //     let xlabel = []
    //     for (let i = startDate; i < endDate; i+=day){
    //         var tti = 0
    //         for (let session of value.sessions){
    //             if (i < session.date){
    //                 tti += session.time
    //             }
    //         }
    //         series.push(tti)
    //         xlabel.push(i)
    //     }
    //     let ss = {
    //         series: [{
    //             name: 'Cumulative Hours',
    //             data: series,
    //         }],
    //         xaxis: [{
    //             type: 
    //         }]
    //     }
    //     this.chart.updateOptions(sessionsseries)
    // }
}

var options = {
    series: [{
        name: 'series1',
        data: [31, 40, 28, 51, 42, 109, 100]
    }, {
        name: 'series2',
        data: [11, 32, 45, 32, 34, 52, 41]
    }],
    chart: {
        height: 350,
        type: 'area'
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth'
    },
    xaxis: {
        type: 'datetime',
        categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
    },
    tooltip: {
        x: {
            format: 'dd/MM/yy HH:mm'
        },
    },
};

SvgPlus.defineHTMLElement(DashBoard);