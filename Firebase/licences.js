import { callFunction, equalTo, get, onChildAdded, onChildRemoved, onValue, orderByChild, query, ref, update } from "./firebase-client.js";

const stripe = Stripe('pk_test_WmYzJXrtzE00MAhbTgAZwhaO00gjCfkWn8', {apiVersion: '2025-01-27.acacia'});

const isEditorStatus = {
    "admin": true,
    "owner": true,
}
const usageKeys = [
    "minutes",
    "sessions",
    "storage",
    "files",
    "quizzes",
    "girds",
]

let watchers = {};

function round(x, y) { return Math.round(Math.pow(10, y) * x) / Math.pow(10, y) }






/**
 * Watches the licences of a user and updates the provided allData object.
 * @param {string} uid - The user ID to watch licences for.
 * @param {Object} allData - The object to store licence data.
 * @param {Function} update - The callback function to call when licence data is updated.
 * 
 * TODO: turn this into a async function that returns a promise that resolves when the data is ready
 * i.e. whel all licences have been loaded including their status and user data is available
 */
export async function watch(uid, allData, update) {

    const licencesByID = {};
    allData.licencesByID = licencesByID;
    allData.licences = [];


    let updateCallback = () => {
        allData.licences = Object.values(licencesByID || {});
        allData.isAdmin = allData.licences.filter(licence => licence.editor).length > 0;
        update();
    }
    let updateLicence = (lid, data, key) => {
        if (typeof lid === "string" && lid.length > 0) {
            if (!(lid in licencesByID)) {
                licencesByID[lid] = {};
            }

            if (typeof key === "string" && key.length > 0) {
                licencesByID[lid][key] = data;
            } else if (typeof data === "object" && data !== null) {
                for (let k in data) {
                    licencesByID[lid][k] = data[k];
                }
            }
        }
    }


    // Stop all previous watchers
    stopWatch();

    let [usageTemplate, tierSettings, tierInfo] = await Promise.all([
        (await get(ref(`licences-settings/usage-template`))).val(),
        (await get(ref(`licences-settings/tier-usage`))).val(),
        (await get(query(ref(`licences-settings/tier-info`), orderByChild("public"), equalTo(true)))).val()
    ]);

    allData.licenceProducts = tierInfo || {};
    const tierNames = {};
    for (let prod in tierInfo) {
        let licence = tierInfo[prod];
        tierNames[licence.tierID] = licence.name || `Tier ${tier}`;
    }

    
    // Initialize allData with empty usage
    allData.usage = {
        hours: { used: 0, max: 0, "%": 0, remaining: 0 }, // Added hours usage
    }
    for (let key in usageTemplate) {
        allData.usage[key] = { used: 0, max: 0, "%": 0, remaining: 0 };
    }

    let parseUsage = (usage) => {
        let parsedUsage = {};
        for (let key in usageTemplate) {
            if (typeof usage === "object" && usage !== null && key in usage) {
                parsedUsage[key] = usage[key];
            } else {
                parsedUsage[key] = usageTemplate[key].default || 0; // Use default value from usageTemplate if not provided
            }
        }
        return parsedUsage;
    }
    

    let updateUsagePercentages = () => {
        for (let key in allData.usage) {
            allData.usage[key]["%"] = allData.usage[key].max > 0 ? round(allData.usage[key].used / allData.usage[key].max, 2) : 0;
            allData.usage[key].remaining = round((allData.usage[key].max - allData.usage[key].used), key === "minutes" ? 0 : 2); // Use 0 decimal places for minutes, 2 for others
        }
    }

    let updateMaxUsage = async (licences) => {    
        let usage = parseUsage(null);
        for (let tier of licences) {
            let tierUsage = parseUsage(tierSettings[tier])
            for (let key in usage) {
                usage[key] += tierUsage[key];
            }
        }
        
        for (let key in usageTemplate) {
            allData.usage[key].max = round(usage[key], key=="minutes"?0:2); // Ensure max is a number with 2 decimal places
        }
        allData.usage.hours.max = round(usage.minutes / 60, 2);
        updateUsagePercentages();
    }

    watchers[`user-${uid}-usage`] = onValue(ref(`users/${uid}/usage`), async (snapshot) => {
        let usageData = parseUsage(snapshot.val());
        for (let key in usageData) {
            allData.usage[key].used = round(usageData[key], key == "minutes" ? 0 : 2) // Ensure used is a number with 2 decimal places
        }
        console.log(allData.usage);
        
        allData.usage.hours.used = round(allData.usage.minutes.used / 60, 2); // Calculate hours used
        updateUsagePercentages();
        updateCallback();
    })

    let listenToLicence = (licenceID, remove = false) => {
        if (remove) {
            if (watchers[licenceID]) {
                watchers[licenceID]();
                delete watchers[licenceID];
            }
        } else {
            watchers[licenceID] = onValue(ref(`licences/${licenceID}`), (snapshot) => {
                let licenceData = snapshot.val();
                if (licenceData) {
                    licenceData.id = licenceID; // Add licence ID to the data
                    updateLicence(licenceID, licenceData);
                } else {
                    // If licence data is null, remove it from licencesByID
                    if ("licencesByID" in allData) {
                        delete allData.licencesByID[licenceID];
                    }
                }
                updateCallback();
            });
        }
    }

    let listenToStatus = (licenceID) => {
        let watchStatusKey = `${licenceID}-status`;
        if (!watchers[watchStatusKey]) {
            watchers[watchStatusKey] = onValue(ref(`licences/${licenceID}/users/${uid}/status`), (snapshot) => {
                let status = snapshot.val();
                updateLicence(licenceID, status, "status");
                updateLicence(licenceID, status in isEditorStatus, "editor");
                listenToLicence(licenceID, !(status in isEditorStatus)); // Remove the licence watcher
                updateCallback();
            });
        }
    }

    watchers.userLicences = onValue(ref(`users/${uid}/licences`), async (snapshot) => {
        let licences = snapshot.val() || {};
        // if (!("licenceTiers" in allData)) {
        //     allData.licenceTiers = {};
        //     allData.licenceTierNames = {};
        // }
        await updateMaxUsage(Object.values(licences));

        await Promise.all(Object.keys(licences).map(async licenceID => {
            updateLicence(licenceID, licences[licenceID], "tier");
            updateLicence(licenceID, tierNames[licences[licenceID]] || "Unknown", "tierName");
            let name = (await get(ref(`licences/${licenceID}/licenceName`))).val();
            updateLicence(licenceID, name, "licenceName");
            listenToStatus(licenceID);
        }));

        // Compute the maximum tier
        allData.maxTier = Math.max(...Object.values(licencesByID).map(({tier}) => tier)) || 0;
        allData.tierName = tierNames[allData.maxTier] || "None";
        updateCallback();
    });
}

/**
 * Stops all watchers for licences.
 */
export function stopWatch() {
    // Stop all watchers
    for (let key in watchers) {
        watchers[key]();
        delete watchers[key];
    }
}

export async function addUsersToLicence(lid, users) {
    let res = await Promise.all(
        users.map(async user => {
            let r = await callFunction("licences-addUser", {user, lid}, "asia-southeast1");
            return r.data;
        })
    );
    return res;
}

export async function removeUsersFromLicence(lid, users) {
    let res = await Promise.all(
        users.map(async user => {
            user.email = user.email.toLowerCase(); // Ensure email is lowercase
            console.log(`Removing user ${user.name} from licence ${lid}: \n ${JSON.stringify(user, null, "\t")}`);
            let r = await callFunction("licences-removeUser", {user, lid}, "asia-southeast1");
            return r.data;
        })
    );
    return res;
}

export async function openBillingPortal(licenceID, return_url) {
    try {
        let res = await callFunction("stripe-createCustomerPortal", {licenceID, return_url}, "asia-southeast1");
        if (res.data && res.data.url) {
            window.open(res.data.url, "_blank");
        } else {
            console.warn("Failed to open billing portal:", res.data.errors);
        }
    } catch (error) {
        console.error("Error opening billing portal:", error);
    }
}

export async function getStripeCheckoutFromClientSecret(clientSecret) {
    const checkout = await stripe.initEmbeddedCheckout({
        fetchClientSecret: async () => {
            return clientSecret || "-";
        },
    });
    return checkout;
}

export async function getStripeCheckout(productID, priceIndex, seats) {
    seats = parseInt(seats);
    priceIndex = parseInt(priceIndex);
    
    let error = null;
    const checkout = await stripe.initEmbeddedCheckout({
        fetchClientSecret: async () => {
            const res = await callFunction("stripe-createLicenceCheckout", {
                priceIndex,
                productID,
                seats,
                return_url: window.location.origin,
            })
            let {errors, client_secret} = res.data;
            
            if (errors.length > 0) {
                console.warn(errors);
                error = errors.join("\n");
                showNotification(error, 3000, "error");
            }
            return client_secret || "-";
        },
    });

    return checkout;
}
