const sideMenu = document.querySelector('aside');
const menuBtn = document.querySelector('#menu-btn');
const closeBtm = document.querySelector('#close-btn');
const themeToggler = document.querySelector('.theme-toggler');
const chart = document.querySelector('#chart').getContext('2d');
const pageToggler = document.querySelector('active');

let exampleData = {
    meetingCount: 6,
    firstName: 'Gabriel',
    lastName: 'Ralph',
    pronouns: 'He/Him',
    displayPhoto: "./images/profile-1.jpg",
    hours: 28,
    'sessions-count': 20,
    email: 'gltralph@gmail.com',
    storage: 150,
    tier: 'Standard',
    sessions: [
        {
            sessionName: 'Meeting with Tom',
            sessionDate: '25/01/2024',
            sessionLength: '-',
            status: 'Scheduled'
        },
        {
            sessionName: 'Session with James',
            sessionDate: '20/01/2024',
            sessionLength: '-',
            status: 'Scheduled'
        },
        {
            sessionName: 'Catchup with RV',
            sessionDate: '23/12/2023',
            sessionLength: '45.3',
            status: 'Complete'
        },
        {
            sessionName: 'Meeting with CK',
            sessionDate: '26/11/2023',
            sessionLength: '26.4',
            status: 'Complete'
        },
        {
            sessionName: 'Quick session with CK',
            sessionDate: '22/11/2023',
            sessionLength: '10.2',
            status: 'Complete'
        }
    ]
}

let tiers = {
    Standard: {
        hours: 50,
        'sessions-count': 20,
        storage: 300
    }
}


function setMain(el) {
    let page = el.getAttribute('type')
    for (let child of document.querySelectorAll("aside a")) {
        child.classList.remove("active");
    }
    el.classList.add("active");
    document.querySelector('main').setAttribute('type', page);

}

setMain(document.querySelector("aside a[type='data & privacy']"))

// meeting count
function update(someData) {
    someData.name = someData.firstName + " " + someData.lastName
    for (let key in someData) {
        let els = document.querySelectorAll(`[vname="${key}"]`);
        for (let el of els) {
            let fieldtype = el.getAttribute('vfield')
            switch (fieldtype) {
                case "innerHTML": el.innerHTML = someData[key];
                    break;
                case "src": el.setAttribute('src', someData[key]);
                    break;
                case "value": el.setAttribute('value', someData[key]);
                    break;
            }
        }
    }


    let tier = tiers[someData.tier];
    for (let key in tier) {
        let percent = someData[key] / tier[key];
        console.log(key);
        document.querySelector(`.insights .${key} circle`).style.setProperty("--percent", percent);
        document.querySelector(`.insights .${key} h1`).innerHTML = someData[key];
        document.querySelector(`.insights .${key} .number p`).innerHTML = Math.round(percent * 100) + '%';

    }

    someData.sessions.forEach(session => {
        const tr = document.createElement('tr');
        const trContent = `
                        <td>${session.sessionName}</td>
                        <td>${session.sessionDate}</td>
                        <td>${session.sessionLength}</td>
                        <td class="${session.status === 'Complete' ? 'success'
                : 'danger'}">${session.status}</td>
                        <td class="primary">Details</td>
                        `;
        tr.innerHTML = trContent;
        document.querySelector('table tbody').appendChild(tr);
    })
}

update(exampleData)

// show sidebar
menuBtn.addEventListener('click', () => {
    sideMenu.style.display = 'block';
})

// close sidebar
closeBtm.addEventListener('click', () => {
    sideMenu.style.display = 'none';
})

// change theme 
themeToggler.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme-variables');

    themeToggler.querySelector('span:nth-child(1)').classList.toggle('active')
    themeToggler.querySelector('span:nth-child(2)').classList.toggle('active')
})

// fill sessions in table 


// create a new chart instance 
new Chart(chart, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

        datasets: [
            {
                label: 'Sessions',
                data: [3, 4, 5, 5, 6, 5, 7, 4, 5, 8, 6, 5],
                borderColor: 'red',
                borderWidth: 2,
                yAxisID: 'y'
            },
            {
                label: 'Total Minutes',
                data: [70, 95, 90, 84, 110, 150, 200, 80, 110, 190, 145, 100],
                borderColor: 'blue',
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ]
    },
    options: {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false
        },
        stacked: false,
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left'
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',

                grid: {
                    drawOnChartArea: false
                }
            }
        }
    }
})

const openBtn = document.getElementById("openModal");
const closebtn = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const inputWrap = document.getElementById("input-wrap");
const openSecond = document.getElementById("openSecondModal");
const secondModal = document.getElementById("modalSecond");
const closeSecond = document.getElementById("closeSecondModal")
const editModal = document.getElementById("editModal")



openBtn.addEventListener("click", () => {
    modal.classList.add("open");
})

closebtn.addEventListener("click", () => {
    modal.classList.remove("open");
    clearForm()
})



function scheduleMeeting(form) {

}

openSecond.addEventListener("click", () => {
    let form = getForm();
    if (form == null) {
        alert('please finish form')
    } else {
        scheduleMeeting(form)
        secondModal.classList.add("open");
        modal.classList.remove("open");
    }
})

closeSecond.addEventListener("click", () => {
    secondModal.classList.remove("open");
    clearForm()
})

editModal.addEventListener("click", () => {
    secondModal.classList.remove("open");
    modal.classList.add("open");
})



document.querySelector("#openSecondModal").addEventListener("click", detailsPage);
const meetingDescription = document.querySelector("[name=description]");
const startTime = document.querySelector("[name=start-time]");
const timeZone = document.querySelector("[name=timezone]");

const months = ["Jan", "Feb", 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dateFormat(datetime, timezone) {
    let d = new Date(datetime)
    let ampm = "AM"
    let hour = d.getHours()
    if (hour > 12) {
        hour = hour - 12;
        ampm = "PM";
    } else if (hour == 0) {
        hour = 12
    }
    console.log(d.getMonth())
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${hour}:${String(d.getMinutes()).padStart(2, "0")} ${ampm} ${timezone}`
}

var detailsMain = document.querySelectorAll("[id=detailsMain]")

function detailsPage() {
    desc = meetingDescription.value;
    $("#meetingDes").val(desc);

    startT = dateFormat(startTime.value, timeZone.value);

    $("#time").val(startT);

    for (var i = 0; i < detailsMain.length; i++)
        detailsMain[i].classList.add("not-empty");

}
