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
        name: 'Sessions',
        data: [3, 5, 4, 5, 7, 5, 4]
    }, {
        name: 'Minutes',
        data: [75, 120, 100, 150, 100, 135, 100]
    }],
      yaxis: [
    {
      title: {
        text: "Sessions"
      },
    },
    {
      opposite: true,
      title: {
        text: "Minutes"
      }
    }
  ],
    chart: {
        height: 350,
        type: 'area',
        fontFamily: 'Poppins'
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth'
    },
    xaxis: {
        type: 'datetime',
        // min: new Date('01 Jan 2024').getTime(),
        // tickAmount: 6
        categories: ["2024-01-05", "2024-01-12", "2024-01-19", "2024-01-26", "2024-02-02", "2024-02-09", "2024-02-16"],
        labels: {
            datetimeFormatter: {
              year: 'yyyy',
              month: 'MMM \'yy',
              day: 'dd MMM',
              hour: 'HH:mm'
            }
          }
    }
    // tooltip: {
    //     x: {
    //         format: 'dd mm yyyy'
    //     },
    // },
};

SvgPlus.defineHTMLElement(DashBoard);