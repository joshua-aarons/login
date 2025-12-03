import { DataComponent, SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js"
import { } from "../../../Utilities/templates/table-plus.js"
import { getNpsData, getExperienceData, getTechnicalData, demoStats, demoChartData, demoComments } from "../../../Firebase/responses.js";
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/+esm';

Chart.register(...registerables);
useCSSStyle("feedback-page");

class ChartWrapper extends SvgPlus {
    onconnect() {
        // Scale chart size baed on container
        this.sizeObserver = new ResizeObserver(() => {
            this.children[0].style.width = this.clientWidth + 'px'; 
            this.children[0].style.height = '300px';
            if (this.children[0].getAttribute("chart") === "experience") {
                this.children[0].style.height = this.parentNode.clientHeight + 'px';
            }
        })
        this.sizeObserver.observe(this);
    }

    ondisconnect() {
        this.sizeObserver.disconnect();
    }
}

SvgPlus.defineHTMLElement(ChartWrapper);

class FeedBack extends DataComponent {
    onconnect() {
        this.els = this.getElementLibrary();
        this.charts = {};
        this.data = null;

        this.experienceLevels = ['Very poor', 'Poor', 'Neutral', 'Good', 'Very good'];
        this.cls = ['positive', 'negative'];
        this.statsChange = {
            "totalResponses": "stat-change-responses",
            "nps": "stat-change-nps",
            "experience": "stat-change-experience"
        }

        // Month label for NPS Score over time
        this.months = {
            0: "January", 1: "February", 2: "March", 3: "April", 4: "May", 5: "June", 
            6: "July", 7: "August", 8: "September", 9: "October", 10: "November", 11: "December"
        }
        this.monthsLabel = {
            0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 
            6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec"
        }

        // Experience chart legend connected to graph tooltip
        const experienceCategories = [this.els["very-poor"], this.els["poor"], this.els["neutral"], this.els["good"], this.els["very-good"]];
        experienceCategories.forEach((category, index) => {
            category.addEventListener('mouseover', () => {
                this.charts.experience.setActiveElements([{ datasetIndex: 0, index: index }]);
                this.charts.experience.tooltip.setActiveElements([{ datasetIndex: 0, index: index }]);
                this.charts.experience.update();
            });

            experienceCategories.forEach((category) => {
                category.addEventListener('mouseleave', () => {
                    this.charts.experience.setActiveElements([]);
                    this.charts.experience.tooltip.setActiveElements([]);
                    this.charts.experience.update();
                });
            });
        });
        
        // Technical chart legend connected to graph tooltip
        this.selectedIndex = 0;
        const backgroundColours = ['rgba(143, 83, 201, 1)', 'rgba(143, 83, 201, 0.9)', 'rgba(143, 83, 201, 0.7)', 'rgba(143, 83, 201, 0.5)'];
        const technicalCategories = [this.els["connectivity"], this.els["audio"], this.els["platform"], this.els["unable"]];
        technicalCategories.forEach((category, index) => {
            category.addEventListener('mouseover', () => {
                this.charts.technical.setActiveElements([{ datasetIndex: 0, index: index }]);
                this.charts.technical.tooltip.setActiveElements([{ datasetIndex: 0, index: index }]);
                this.charts.technical.update();
            });

            category.addEventListener('mouseleave', () => {
                this.charts.technical.setActiveElements([{ datasetIndex: 0, index: this.selectedIndex }]);
                this.charts.technical.tooltip.setActiveElements([{ datasetIndex: 0, index: this.selectedIndex }]);
                this.charts.technical.update();
            });

            category.addEventListener('click', () => {
                this.selectedIndex = index;
                document.querySelectorAll('.legend-color').forEach(el => el.style.backgroundColor = '#ddd');
                category.querySelector('.legend-color').style.backgroundColor = backgroundColours[index];

                this.charts.technical.setActiveElements([{ datasetIndex: 0, index: index }]);
                this.charts.technical.tooltip.setActiveElements([{ datasetIndex: 0, index: index }]);
                this.charts.technical.update();
            });
        })

        this.querySelectorAll('.dropdown-content').forEach(drop => {
            const graph = drop.getAttribute('graph');
            drop.querySelectorAll('.dropdown-item').forEach(item => {
                const filterType = item.getAttribute('filter');
                const title = item.textContent;
                item.addEventListener('click', () => {
                    this.setFilter(filterType, graph, title);
                })
            })
        })

        this.els["default-search"].addEventListener('input', (e) => {
            let i = 0;
            const searchTerm = e.target.value.toLowerCase();
            const rows = this.els.commentsBody.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
                if (rowText.includes(searchTerm)) {
                    row.classList.remove('hidden');
                    row.style.backgroundColor = (i % 2 == 0) ? 'transparent' : '#0000000b';
                    i++;
                } else {
                    row.classList.add('hidden');
                }
            });
        });

        const scaleCharts = (mq) => {
            Chart.defaults.font.size = mq.matches ? 10 : 14;    
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.update === 'function') chart.update();
            });      
        }

        const chartsMediaQuery = window.matchMedia("(max-width: 600px)")
        chartsMediaQuery.addEventListener("change", () => {
            scaleCharts(chartsMediaQuery);
        });

        scaleCharts(chartsMediaQuery);

        this.addEventListener('after-onvalue', (e) => {
            const comp = e.target; 
            comp.els.demoButton.click(); 
        });
    }

    updateStatsItem(stats) {
        const statTypes = ['totalResponses', 'nps', 'experience'];
        statTypes.forEach(stat => {
            let value = `responses/stats/${stat}/statValue`;
            let src = `responses/stats/${stat}/imageSrc`;
            this.els[value].innerHTML = stats[stat].statValue;
            this.els[src].src = stats[stat].imageSrc;
        })
    }

    updateStatsChange(stats, statType, statChangeDiv) {
        statChangeDiv.classList.remove(...this.cls);
        statChangeDiv.classList.add(stats[statType].isPositive ? 'positive' : 'negative');
        statChangeDiv.innerHTML = `
            <span class="fa-solid ${stats[statType].icon} arrow"></span>
            <span>${stats[statType].statChange}</span>
        `;
    }

    updateCharts(chartData) {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};

        Chart.defaults.font.family = "'Poppins', sans-serif";
   
        this.charts.timeline = new Chart(this.els.timelineChart, {
            type: 'bar',
            data: {
                labels: Object.keys(chartData.timeline).map(i => this.monthsLabel[chartData.timeline[i].x]),
                datasets: [
                    {
                        data: chartData.timeline,
                        backgroundColor: 'rgba(143, 83, 201, 0.6)',
                        borderRadius: 20,
                        hoverBackgroundColor: '#8f53c9',
                        barPercentage: 0.6,
                        borderSkipped: false,
                    }  
                ]
            },
            options: {
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                interaction: {  
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        displayColors: false,
                        padding: 10,
                        callbacks: {
                            title: context => {
                                if (this.demoToggled) {
                                    return this.months[context[0].parsed.x];
                                }
                                const currentMonth = new Date().getMonth();
                                const filterMonth = currentMonth - 9 + context[0].parsed.x >= 0 
                                    ? currentMonth - 9 + context[0].parsed.x 
                                    : 12 + (currentMonth - 9 +   context[0].parsed.x);
                                return this.months[filterMonth];
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 40
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5,
                        },
                        title: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                }
            }
        });

        this.charts.nps = new Chart(this.els.npsChart, {
            type: 'pie',
            data: {
                labels: ['Detractors', 'Passives', 'Promoters'],
                datasets: [{
                    data: chartData.nps,
                    backgroundColor: ['rgba(115, 128, 236, 0.4)', 'rgba(115, 128, 236, 0.75)', 'rgba(115, 128, 236, 1)'],
                    borderWidth: 0,
                    hoverOffset: 8,
                }]
            },
            options: {
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        position: 'top',
                        display: true,
                        font: {
                            weight: 'normal',
                        }
                    },
                    tooltip: {
                        displayColors: false,
                        padding: 10,
                    },
                    legend: {
                        onHover: (e, legendItem, legend) => {
                            const index = legendItem.index;
                            const chart = legend.chart;
                            chart.setActiveElements([{ datasetIndex: 0, index }]);
                            chart.tooltip.setActiveElements([{ datasetIndex: 0, index }]);
                            chart.update();
                        },
                        position: 'bottom',
                        labels: {
                            padding: 15, 
                        }
                    }
                }
            }
        });

        this.charts.experience = new Chart(this.els.experienceChart, {
            type: 'line',
            data: {
                datasets: [{
                    data: chartData.experience.experienceData,
                    borderColor: '#7380ec',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#7380ec',
                    tension: 0.35,
                    fill: true,
                    clip: false,
                    segment: {
                        backgroundColor: ctx => {
                            const i = ctx.p0DataIndex;
                            const colors = ['rgba(115, 128, 236, 0.5)' ,'rgba(115, 128, 236, 0.4)', 'rgba(115, 128, 236, 0.3)', 'rgba(115, 128, 236, 0.2)', 'rgba(115, 128, 236, 0.1)'];
                            return colors[i % colors.length];
                        }
                    }
                }]
            },
            options: {
                onHover: (e, activeElements, chart) => {
                    if (activeElements[0].index === 5) {
                        activeElements.pop();
                        chart.draw();
                    }
                },
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        position: 'top',
                        display: true,
                        font: {
                            weight: 'normal',
                        }
                    },
                    tooltip: {
                        displayColors: false,
                        padding: 10,
                        callbacks: {
                            title: context => {
                                if (context.length === 0) {
                                    return null;
                                }
                                return this.experienceLevels[context[0].dataIndex];
                            },
                        },
                        filter: function(tooltipItem) {
                            return tooltipItem.dataIndex !== 5;
                        }
                    },
                },
                layout: {
                    padding: {
                        top: 10
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        display: false,
                        grid: {
                            lineWidth: 0.5,
                        },
                    },
                    y: {
                        display: false,
                        grid: {
                            display: false
                        },
                        min: 0,
                        ticks: {
                            stepSize: 1,
                        }
                    }
                }
            }
        });

        this.charts.technical = new Chart(this.els.technicalChart, {
            type: 'doughnut',
            data: {
                labels: ['Connectivity', 'Audio', 'Platform', "Unable to resolve"],
                datasets: [{
                    data: chartData.technical.technicalData,
                    backgroundColor: ['rgba(143, 83, 201, 1)', 'rgba(143, 83, 201, 0.9)', 'rgba(143, 83, 201, 0.7)', 'rgba(143, 83, 201, 0.5)'],
                    borderWidth: 0,
                    rotation: 180,
                    cutout: '60%',
                }]
            },
            options: {
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: false 
                    },
                    title: {
                        position: 'top',
                        display: true,
                        font: {
                            weight: 'normal',
                        }
                    },
                    tooltip: {
                        displayColors: false,
                        padding: 10
                    }
                }
            },
        });
    }

    updateComments(responses) {
        this.els.commentsBody.innerHTML = '';
        const sortedResponses = [...responses].sort((a, b) => b.date - a.date);
        
        sortedResponses.forEach((response, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.formatDateComments(response.date)}</td>
                <td>${response.experience || '-'}</td>
                <td>${response.technicalDifficulties ? response.technicalDifficulties.join(', ') : '-'}</td>
                <td>${response.npsScore !== -1 ? response.npsScore : '-'}</td>
                <td>${response.comments || '-'}</td>
            `;
            this.els.commentsBody.appendChild(row);
        });
    }

    formatDateComments(date) {
        const formattedDate = new Date(date);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true };
        return formattedDate.toLocaleDateString('en-GB', options).replace(',', '').toUpperCase();
    }

    filterResponsesByDate(responses, filterType) {
        const now = Date.now();

        switch (filterType) {
            case 'all':
                [...responses].sort((a, b) => a.date - b.date);
            return responses;
            case 'today':
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                return responses.filter(r => r.date >= Date.parse(today));
            case 'week':
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                return responses.filter(r => r.date >= Date.parse(weekAgo));
            case 'month':
                const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
                return responses.filter(r => r.date >= Date.parse(monthAgo));
            case 'quarter':
                const quarterAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
                return responses.filter(r => r.date >= Date.parse(quarterAgo));
        }
    }

    filterResponsesByMonth(responses) {
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        return responses.filter(r => new Date(r.date).getMonth() === month && new Date(r.date).getFullYear() === year);
    }

    updateTechnicalLegend(filteredData) {
        const legendItems = ["Connectivity", "Audio", "Platform", "Unable to resolve"]
        legendItems.forEach(issue => {
            let count = `responses/charts/technical/legend/${issue}/count`;
            let percent = `responses/charts/technical/legend/${issue}/percent`;
            this.els[count].innerHTML = filteredData.legend[issue].count;
            this.els[percent].innerHTML = filteredData.legend[issue].percent;
        })
    }

    updateExperienceLegend(filteredData) {
        const legendItems = ["Very poor", "Poor", "Neutral", "Good", "Very good"];
        legendItems.forEach(rating => {
            let count = `responses/charts/experience/legend/${rating}`;
            this.els[count].innerHTML = filteredData.legend[rating];
        })
    }

    setFilter(filterType, graph, title) {
        if (this.demoToggled) return;
        
        const filteredResponses = this.filterResponsesByDate(this.data.responses, filterType);
        if (graph === 'nps') {
            this.charts.nps.options.plugins.title.text = title;
            this.charts.nps.data.datasets[0].data = getNpsData(filteredResponses);
            this.charts.nps.update();
        }
        else if (graph === 'experience') {
            this.charts.experience.options.plugins.title.text = title;
            const filteredData = getExperienceData(filteredResponses);
            this.updateExperienceLegend(filteredData);
            this.charts.experience.data.datasets[0].data = filteredData.experienceData;
            this.charts.experience.update();
        }
        else if (graph === 'technical') {
            this.charts.technical.options.plugins.title.text = title;
            const filteredData = getTechnicalData(filteredResponses);
            this.updateTechnicalLegend(filteredData);
            this.charts.technical.data.datasets[0].data = filteredData.technicalData;
            this.charts.technical.update();
        }
    }

    onvalue(data) {
        if (isSameObj(this.data, data)) {
            return;
        }
        
        this.demoToggled = true ? Object.keys(data).includes("toggled") : false

        this.data = data;
        this.updateCharts(data.charts);
        Object.entries(this.statsChange).forEach(([statType, statChangeDiv]) => {
            this.updateStatsChange(data.stats, statType, this.els[statChangeDiv]);
        })
        this.updateComments(data.responses);
        this.updateStatsItem(data.stats);
        this.updateExperienceLegend(data.charts.experience);
        this.updateTechnicalLegend(data.charts.technical);
    }
}

SvgPlus.defineHTMLElement(FeedBack);

function isSameObj(o1, o2) {
    if (typeof o1 === typeof o2) {
        if (typeof o1 === "object" && o1 !== null) {
            if (Object.keys(o1).length !== Object.keys(o2).length) {
                return false;
            }
            for (let key in o1) {
                if (!isSameObj(o1[key], o2[key])) {
                    return false;
                }
            }
            return true;
        } else {
            return o1 === o2;
        }
    }
    return false;
}

class FeedbackPage extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("feedback-page");
        this.demoToggled = true;
        this.els.demoButton.addEventListener('click', () => {
            this.demoToggled = !this.demoToggled;
            this.value = this.data;
        })
        this.initialised = false;
    }

    set demoToggled(value) {
        this._demoToggled = value;
        this.els.demoButton.textContent = this.demoToggled ? 'Hide demo' : 'Show demo';
    }

    get demoToggled() {
        return this._demoToggled;
    }

    onvalue(data) {
        if (!data || !data.responses) return;

        if (!this.initialised && data.responses.responses.length === 0) {
            this.demoToggled = true;
        }
        this.initialised = true;
        let responses = this.demoToggled ? { stats: demoStats, charts: demoChartData, responses: demoComments, toggled: true } : data.responses;
        this.els.root.value = responses;

        this.data = data;
    }
}

SvgPlus.defineHTMLElement(FeedbackPage);