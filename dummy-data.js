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
    tier: 'Standard'
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
    for (let listener of listeners){
        listener(userData)  
    }
    console.log(userData)
}

var listeners = []

export function addListener(listener) {
    if (listener instanceof Function)
        listeners.push(listener)
    updateUserData(userData)
}