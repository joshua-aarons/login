import { ref, onValue } from  "./firebase-client.js"

let watchers = [];

const experienceRatings = {
    'Very poor': 1,
    'Poor': 2,
    'Neutral': 3,
    'Good': 4,
    'Very good': 5
}

const technicalIssues = ['connectivity', 'audio', 'platform', 'unable'];
const technicalIssuesLegend = ['Connectivity', 'Audio', 'Platform', "Unable to resolve"];

function getStatData(responses) {
    const stats = {}

    const currentMonth = new Date().getMonth();
    const lastMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    const currentMonthResponses = responses.filter(r => new Date(r.date).getMonth() === currentMonth);
    const lastMonthResponses = responses.filter(r => new Date(r.date).getMonth() === lastMonth);

    const totalResponsesChange = currentMonthResponses.length === 0
        ? 0
        : (currentMonthResponses.length - lastMonthResponses.length) / lastMonthResponses.length * 100

    let isPositive = totalResponsesChange >= 0;
    stats['totalResponses'] = {
        "isPositive": isPositive,
        "statValue": currentMonthResponses.length,
        "statChange": isPositive ? totalResponsesChange.toFixed(1) + '%' : Math.abs(totalResponsesChange).toFixed(1) + '%',  
        "imageSrc": isPositive ? "../../../images/feedback/positive-up.png" : "../../../images/feedback/negative-down.png",
        "icon": isPositive ? "fa-arrow-up" : "fa-arrow-down"
    }

    const sumNPS = (sum, r) => {
        if (r.npsScore !== -1) {
            return sum + r.npsScore;
        }
        return sum;
    };

    const currAvgNps = currentMonthResponses.reduce(sumNPS, 0) > 0
        ? currentMonthResponses.reduce(sumNPS, 0) / currentMonthResponses.filter(r => r.npsScore !== - 1).length
        : 0;
    const lastAvgNps = lastMonthResponses.reduce(sumNPS, 0) > 0
        ? lastMonthResponses.reduce(sumNPS, 0) / lastMonthResponses.filter(r => r.npsScore !== - 1).length
        : 0;
    const npsChange = currAvgNps === 0
        ? 0
        : (currAvgNps - lastAvgNps) / lastAvgNps * 100;

    isPositive = npsChange >= 0;
    stats['nps'] = {
        "isPositive": isPositive,
        "statValue": currAvgNps.toFixed(1), 
        "statChange": isPositive ? npsChange.toFixed(1) + '%' : Math.abs(npsChange).toFixed(1) + '%',
        "imageSrc": isPositive ? "../../../images/feedback/positive-up.png" : "../../../images/feedback/negative-down.png",
        "icon": isPositive ? "fa-arrow-up" : "fa-arrow-down"
    }
    
    const sumExp = (sum, r) => {
        if (r.experience) {
            return sum + experienceRatings[r.experience];
        }
        return sum;
    }

    const currAvgExp = currentMonthResponses.reduce(sumExp, 0) > 0
        ? currentMonthResponses.reduce(sumExp, 0) / (currentMonthResponses.filter(r => r.experience !== '').length * 5) * 100
        : 0;
    const lastAvgExp = lastMonthResponses.reduce(sumExp, 0) > 0
        ? lastMonthResponses.reduce(sumExp, 0) / (lastMonthResponses.filter(r => r.experience !== '').length * 5) * 100
        : 0;

    const expChange = currAvgExp === 0
        ? 0
        : (currAvgExp - lastAvgExp) / lastAvgExp * 100;

    isPositive = expChange >= 0 ;
    stats['experience'] = {
        "isPositive": isPositive,
        "statValue": currAvgExp.toFixed(1) + '%', 
        "statChange": isPositive ? expChange.toFixed(1) + '%' : Math.abs(expChange).toFixed(1) + '%',
        "imageSrc": isPositive ? "../../../images/feedback/positive-up.png" : "../../../images/feedback/negative-down.png",
        "icon": isPositive ? "fa-arrow-up" : "fa-arrow-down"
    }

    return stats;
}

function getTimelineData(data) {
    const sumNPS = (sum, r) => {
        if (r.npsScore !== -1) {
            return sum + r.npsScore;
        }
        return sum;
    };

    const npsScores = [];
    const currentMonth = new Date().getMonth();
    for (let i = 0; i < 10; i++) {
        const filterMonth = currentMonth - i >= 0 ? currentMonth - i : 11 + (currentMonth - i + 1);
        const currentMonthResponses = data.filter(r => new Date(r.date).getMonth() === filterMonth)

        const monthData = {}
        monthData.x = filterMonth;
        if (currentMonthResponses.length > 0) {
            const avgNPS = currentMonthResponses.reduce(sumNPS, 0) / currentMonthResponses.filter(r => r.npsScore !== -1).length;
            monthData.y = avgNPS.toFixed(2);
        } 
        else {
            monthData.y = 0;
        }
        npsScores.push(monthData);
    }
    npsScores.sort((a, b) => a.x - b.x);
    return npsScores;
}

export function getNpsData(data) {
    const detractors = data.filter(r => r.npsScore >= 0 && r.npsScore < 7).length;
    const passives = data.filter(r => r.npsScore >= 7 && r.npsScore < 9).length;
    const promoters = data.filter(r => r.npsScore >= 9 && r.npsScore <= 10).length;
    const npsData = [detractors, passives, promoters];
    return npsData;
}

export function getExperienceData(data) {
    const experienceData = {};
    const legend = {}
    let count;
    Object.keys(experienceRatings).forEach((level, index) => {
        count = data.filter(r => r.experience === level).length;
        experienceData[index] = count;
        legend[level] = count;
    })
    experienceData[5] = count;

    return { experienceData, legend };
}

export function getTechnicalData(data) {
    const technicalData = [];
    const legend = {};
    
    for (const issue of technicalIssues) {
        const issueCount = data.filter(r => {
        if (r.technicalDifficulties) {
            return r.technicalDifficulties.includes(issue);
        }
        }).length;
        technicalData.push(issueCount);
    }

    const technicalDataPercent = technicalData.map(v => v === 0 ? '0%' : ((v / technicalData.reduce((a, b) => a + b, 0)) * 100).toFixed(0) + '%');
    technicalIssuesLegend.forEach((issue, index) => {
        legend[issue] = {
            "percent": `${technicalIssuesLegend[index]} (${technicalDataPercent[index]})`,
            "count": `${technicalData[index]} reports`
        }
    });
    return { technicalData, legend };
}

function getChartData(data) {
    const chartData = {
        'timeline': [],
        'nps': [],
        'experience': [],
        'technical' : []
    }

    chartData.timeline = getTimelineData(data);
    chartData.nps = getNpsData(data);
    chartData.experience = getExperienceData(data);
    chartData.technical = getTechnicalData(data);

    return chartData;
}

function parseData(responses) {
    const stats = getStatData(responses);
    const charts = getChartData(responses);
    return { responses, stats, charts };
}
 
export function watch(uid, allData, updateCallback) {
    let end = onValue(ref(`users/${uid}/responses`), (snapshot) => {
        let responses = snapshot.val();
        const data = Object.entries(responses).map(([key, value]) => {
            if (!value.date) {
                return {date: parseInt(key), ...value}
            } else {
                return value;
            }
        });
        allData.responses = parseData(data);
        updateCallback();
    })
    watchers.push(end);
}

export function stopWatch() {
    for (const end of watchers) {
        end();
    }
    watchers = [];
}

export const demoStats = {
    totalResponses: {
        isPositive: false,
        statValue: 52, 
        statChange: '3.95%',
        imageSrc: '../../../images/feedback/negative-down.png',
        icon: 'fa-arrow-down'
    },
    nps: {
        isPositive: true,
        statValue: '7.8', 
        statChange: '5.21%',
        imageSrc: '../../../images/feedback/positive-up.png',
        icon: 'fa-arrow-up'
    },
    experience: {
        isPositive: true,
        statValue: '87%', 
        statChange: '7.50%',
        imageSrc: '../../../images/feedback/positive-up.png',
        icon: 'fa-arrow-up'
    }
};

export const demoChartData = {
    timeline: [
        { x: 0, y: 7 }, 
        { x: 1, y: 6.3 }, 
        { x: 2, y: 9 },
        { x: 3, y: 8 }, 
        { x: 4, y: 10 }, 
        { x: 5, y: 8.4 }, 
        { x: 6, y: 6 }, 
        { x: 7, y: 7 }, 
        { x: 8, y: 9 }, 
        { x: 9, y: 9.3 }  
    ],
    nps: [2, 5, 10],
    experience: {
        experienceData: [
            {x: 0, y: 3},
            {x: 1, y: 7},
            {x: 2, y: 10},
            {x: 3, y: 16},
            {x: 4, y: 13},
            {x: 5, y: 13},
        ],
        legend: {
            'Very poor': 3,
            'Poor': 7,
            'Neutral': 10,
            'Good': 16,
            'Very good': 13
        }
    },
    technical: {
        technicalData: [5, 11, 7, 15],
        legend: {
            'Connectivity': {
                count: '5 reports',
                percent: 'Connectivity (13%)'
            },
            'Audio': {
                count: '11 reports',
                percent: 'Audio (29%)'
            },
            'Platform': {
                count: '7 reports',
                percent: 'Platform (18%)'
            },
            'Unable to resolve': {
                count: '15 reports',
                percent: 'Unable to resolve (39%)'
            }
        }
    }
};

export const demoComments = [
    {date: 1760499479990, comments: 'Not 100% since I had some issues using it.', experience: 'Very poor', technicalDifficulties: ['waiting room', 'connectivity' ,'unable'], npsScore: 3},
    {date: 1760499451732, comments: 'Better than I expected and easy to use.', experience: 'Very good', npsScore: 10},
    {date: 1759813079487, comments: 'The platform was slow to load, but it worked eventually.', experience: 'Neutral', technicalDifficulties: ['connectivity'], npsScore: 5},
    {date: 1759810884840, comments: 'No issues encountered, everything was smooth.', experience: 'Very good', npsScore: 9},
    {date: 1759536349692, comments: 'Had trouble connecting to the audio, but resolved it after a restart.', experience: 'Good', technicalDifficulties: ['audio'], npsScore: 7}
];