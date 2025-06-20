// import {
//     signInWithEmailAndPassword,
//     createUserWithEmailAndPassword,
//     sendPasswordResetEmail,
//     sendEmailVerification,
//     signOut,
//     callFunction,
//     ref,
//     onValue,
//     get,
//     update,
//     child,
//     onChildAdded,
//     push,
//     set,
//     addAuthChangeListener,
//     initialise,
//     getUser

// } from "./firebase-client.js"
// const SESSION_ROOT_KEY = "meetings";


// /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SIGNIN/OUT FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */


// // function callF(name, data) {
// //     return callFunction(name, data, "asia-southeast1")
// // }



// /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SESSION FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Make session creates a new session signaling channel in the database
// // returns the new session key */
// // export async function createSession(info) {
// //     let { data } = await callF('createSession', info);
// //     return parseSession(data);
// // }

// // export async function deleteSession(sid) {
// //     const del = await callF('deleteSession', { sid });
// // }

// // export async function editSession(info) {
// //     let { data } = await callF('editSession', info);
// //     return parseSession(data);
// // }


// // /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DATA ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
// // let DataListeners = []
// // let OldData = null
// // export function addDataListener(obj) {
// //     if (obj instanceof Function) {
// //         DataListeners.push(obj);
// //         if (OldData) {
// //             obj(parseData(OldData));
// //         }
// //     }
// // }


// // function updateDataListeners(sc) {
// //     OldData = sc;

// //     let value = parseData(sc);
// //     if (value.admin != null) {
// //         watchAdmin(value.admin);
// //     }

// //     for (let listener of DataListeners) {
// //         listener(parseData(sc))
// //     }
// // }

// // let FirebaseDataListeners = []
// // async function watchData() {
// //     stopWatch()
// //     if (getUser() != null) {
// //         let userInfoRef = getUserRef()
// //         let us = await callF("updateSessions")
// //         // await get(userInfoRef)
// //         onValue(userInfoRef, (value) => {
// //             updateDataListeners(value)
// //         })
// //     }
// // }
// // function stopWatch() {
// //     for (let listener of FirebaseDataListeners) {
// //         listener()
// //     }
// // }

// /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ADMIN ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
// // let AdminListeners = []
// // let OldAdmin = null
// // export function addAdminListener(obj) {
// //     if (obj instanceof Function) {
// //         AdminListeners.push(obj);
// //         if (OldAdmin) {
// //             obj(OldAdmin);
// //         }
// //     }
// // }


// // function updateAdminListeners(sc) {
// //     OldAdmin = sc
// //     for (let listener of AdminListeners) {
// //         listener(sc)
// //     }
// // }

// // let FirebaseAdminListeners = []
// // async function watchAdmin(name) {
// //     stopAdminWatch()

// //     if (getUser() != null) {
// //         let adminRef = ref(`companies/${name}`)
// //         onValue(adminRef, (value) => {
// //             updateAdminListeners(value.val())
// //         })
// //     }
// // }
// // function stopAdminWatch() {
// //     for (let listener of FirebaseAdminListeners) {
// //         listener()
// //     }
// // }

// // export async function updateAdminUsers(info) {
// //     const {data} = await callF('updateAdminUsers', info);
// //     return data
// // }

// // export async function removeAdminUser(email) {
// //     const {data} = callF('removeAdminUser',{ email });
// //     console.log("remove", data);
// //     return data
// // }


// /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DATA PARSER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

// // const TIER_USAGE_PER_MONTH = {
// //     default: {
// //         minutes: 0,
// //         sessions: 0,
// //         storage: 0,
// //     },
// //     Standard: {
// //         minutes: 4 * 2 * 60,
// //         sessions: 20,
// //         storage: 300,
// //     },
// //     Pro: {
// //         minutes: 60 * 1000,
// //         sessions: 1000,
// //         storage: 500,
// //     }
// // }
// // export function parseSession(session) {
// //     let ds = new Date(session.time);
// //     ds.setMinutes(ds.getMinutes() + ds.getTimezoneOffset());
// //     if ((new Date()).getTime() > ds.getTime() + session.duration * 60 * 1000) {
// //         session.status = "complete"
// //     }
// //     session.date = `${ds.getDate()}/${ds.getMonth() + 1}/${ds.getFullYear()} ${ds.toLocaleTimeString("en", { timeStyle: "short" })}`
// //     session.link = `${window.location.origin}/Session/?${session.sid}`
// //     return session;
// // }
// // function round(x, y) { return Math.round(Math.pow(10, y) * x) / Math.pow(10, y) }
// // let LastInfo = null;
// // const DATA_PARSERS = [
// //     {
// //         name: "info",
// //         parse: (info) => {
// //             let user = getUser();
// //             if (info == null) {
// //                 info = {
// //                     firstName: "",
// //                     lastName: "",
// //                     displayName: user.displayName,
// //                     email: user.email,
// //                 }
// //                 setUserInfo(info);
// //             }
// //             if (!info.email)
// //                 info.email = user.email

// //             if (!info.displayName || info.displayName == '')
// //                 info.displayName = info.firstName + ' ' + info.lastName

// //             if (!info.displayPhoto) info.displayPhoto = user.photoURL

// //             if (!info.optionalData) info.optionalData = false;

// //             if (typeof info.displayPhoto != 'string')
// //                 info.displayPhoto = "./images/defaultdp.svg"
// //             LastInfo = info;
// //             return info;
// //         },
// //     },
// //     {
// //         name: "sessions",
// //         parse: (sessions) => {
// //             let nSessions = [];
// //             if (typeof sessions == "object" && sessions != null) {
// //                 for (let key in sessions) {
// //                     let session = sessions[key];
// //                     nSessions.push(parseSession(session));
// //                 }
// //             }
// //             return nSessions;
// //         }
// //     },
// //     {
// //         name: "licence",
// //         parse: (licence) => {
// //             if (licence == null) {
// //                 licence = {
// //                     tier: "None"
// //                 };
// //             }
// //             return licence;
// //         }
// //     },
// //     {
// //         name: "admin",
// //         parse: (value) => {

// //             return value;
// //         }
// //     },
// //     {
// //         name: "usage",
// //         parse: (usage, data) => {
// //             if (usage == null) usage = {};

// //             let pusage = {
// //                 minutes: { used: 0 },
// //                 sessions: { used: 0 },
// //                 storage: { used: 0 },
// //                 hours: { used: 0 }
// //             };
// //             let tier = data.licence.tier;
// //             let maxUsage = TIER_USAGE_PER_MONTH[tier];

// //             for (let key in maxUsage) {
// //                 let used = round(key in usage ? usage[key] : 0, 1);
// //                 let max = maxUsage[key];
// //                 pusage[key].max = max;
// //                 pusage[key].used = used;
// //                 pusage[key]['%'] = (max == 0) ? 0 : round(used / max, 2);
// //                 pusage[key].remaining = max - used;
// //             }

// //             for (let key of ["max", "used", "remaining", "%"]) pusage.hours[key] = key == '%' ? pusage.minutes[key] : round(pusage.minutes[key] / 60, 2);

// //             return pusage;
// //         }
// //     }
// // ]
// // export function parseData(sc) {
// //     let data = sc.val()
// //     if (data == null) {
// //         data = {};
// //     }

// //     for (let dp of DATA_PARSERS) {
// //         let value = dp.name in data ? data[dp.name] : null;
// //         data[dp.name] = dp.parse(value, data);
// //     }

// //     return data
// // }




// async function updateDisplayPhoto(file, callback) {
//     let url = await uploadFileToCloud(file, `users/${User.uid}/displayPhoto`)
//     setUserInfo({ displayPhoto: url })
// }


// // addAuthChangeListener((user) => {
// //     if (user != null) {
// //         watchData()
// //     }
// // })

// export {initialise, addAuthChangeListener, sendEmailVerification, child, get, push, set, onChildAdded, onValue, resetPassword, updateDisplayPhoto }


