let tiers = {
    Standard: {
        hours: 50,
        'sessions-count': 20,
        storage: 300
    }
}

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
    hours: 30,
    'sessions-count': 10,
    email: 'gltralph@gmail.com',
    storage: 250,
    tier: 'Standard',
    sessions: [
        {
            description: 'Meeting with Tom',
            date: '31/01/2024',
            time: '31 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: '45',
            status: 'Scheduled',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        },
        {
            description: 'Quick catch up',
            date: '25/01/2024',
            time: '25 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: '45',
            status: 'Scheduled',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        },
        {
            description: 'Session with James',
            date: '20/01/2024',
            time: '20 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: '60',
            status: 'Scheduled',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        },
        {
            description: 'Meeting with CK',
            date: '12/01/2024',
            time: '12 01 2024 5:10 PM (GMT+9:30) Darwin',
            duration: '60',
            status: 'Complete',
            id: 'xxxxxxxxxxxx',
            link: 'https://app.squidly.com.au/Session/?-xxxxxxxxxxxx'
        }
    ],
    members: [
        {name: "John Smith", email: "john.smith@gmail.com", status: "admin"},
        {name: "Ann Smith", email: "Ann.smith@gmail.com", status: "staff"}
    ]
}

export function updateUserData(value) {
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


function updateListeners(l = null){
    let ls = listeners;
    if (l !== null) ls = [l]
    for (let listener of ls){
        let clone = JSON.parse(JSON.stringify(userData));
        listener(clone)  
    }
}

var listeners = []

export function addListener(listener) {
    if (listener instanceof Function){
        listeners.push(listener)
        updateListeners(listener);
    }
}