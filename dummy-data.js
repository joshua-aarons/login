let tiers = {
    Standard: {
        hours: 50,
        'sessions-count': 20,
        storage: 300
    }
}

var listeners = []

let userData = {
    displayPhoto: "./images/profile-1.jpg",
    firstName: "Josh",
    lastName: "Aarons",
    email: "joshua.aarons@ymail.com",
    displayName: "Josh Aarons",
    pronouns: "he/him",
    tier: "Standard",
    optionalData: false,
    meetingCount: 6,
    email: 'gltralph@gmail.com',
    storage: 250,
    maxmembers: 25,
    admin: true,
    sessions: [
        {
            description: 'Meeting with Tom',
            date: '31/01/2024',
            time: '31 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: 45,
            status: 'Scheduled',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        },
        {
            description: 'Quick catch up',
            date: '25/01/2024',
            time: '25 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: 55,
            status: 'Scheduled',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        },
        {
            description: 'Session with James',
            date: '20/01/2024',
            time: '20 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: 70,
            status: 'Scheduled',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        },
        {
            description: 'Meeting with CK',
            date: '12/01/2024',
            time: '12 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: 60,
            status: 'Complete',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        },
        {
            description: 'First meeting',
            date: '01/01/2024',
            time: '01 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: 25,
            status: 'Complete',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        }
    ],
    members: [
        {name: "John Smith", email: "john.smith@gmail.com", status: "admin"},
        {name: "Ann Smith", email: "Ann.smith@gmail.com", status: "staff"},
        {name: "Josh Aarons", email: "joshua.aarons@ymail.com", status: "admin"}
    ]
}

export function updateUserData(value) {
    userData["sessions-count"] = userData.sessions.length
    let mins = 0
    for (let d of userData.sessions.map(s => s.duration))
        mins += d

    userData.hours = Math.round(mins/6)/10

    if ("tier" in value && value.tier in tiers) {
        for (let key in tiers[value.tier]) {
            userData['max' + key] = tiers[value.tier][key];
            if (key in userData)
                userData[key + "%"] = userData[key] / tiers[value.tier][key]
        }
    }
    for (let key in value){
        userData[key] = value[key]
    }

    try {
        throw new Error()
    } catch(e){
        console.log(e, userData);
    }
    updateListeners();
}

updateUserData(userData)

function updateListeners(l = null){
    let ls = listeners;
    if (l !== null) ls = [l]
    for (let listener of ls){
        let clone = JSON.parse(JSON.stringify(userData));
        listener(clone)  
    }
}


export function addListener(listener) {
    if (listener instanceof Function){
        listeners.push(listener)
        updateListeners(listener);
    }
}