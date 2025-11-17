import { SvgPlus, UserDataComponent } from "../Utilities/CustomComponent.js";
import { Table } from "./table2.js";

function formatTime(duration) {
    let hours = Math.floor(duration / 60);
    let minutes = duration % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}
function shortUID(uid) {
    return uid.slice(0, 3) + "..." + uid.slice(-3);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const tick = "<span style='color: green;'>✔</span>";
const cross = "<span style='color: red;'>✘</span>";
const star = "<span style='color: #ffc100;'>★</span>";
function formatDate(timestamp) {
    if (!timestamp) return "N/A";
    let now = (new Date()).getFullYear();
    let date = new Date(timestamp);
    let day = date.getDate();
    let month = MONTH_NAMES[date.getMonth()];
    let year = date.getFullYear();
    let hours = date.getHours();
    let minutes = date.getMinutes();

    let dateOnly = year !== now ? `${day} ${month} ${(year+"").slice(-2)}` : `${day} ${month}`;
    return `${dateOnly}`;
}
function argMax(arr, func) {
    let maxIndex = -1;
    let maxValue = -Infinity;
    arr.forEach((item, index) => {
        let value = func(item);
        if (value > maxValue) {
            maxValue = value;
            maxIndex = index;
        }
    });
    return maxIndex;
}

const TIER_NAMES = {
    0: "None",
    1: "Free",
    2: "Standard",
    3: "Pro"
}

export class MetricsView extends UserDataComponent {
    constructor() {
        super("metrics-view");
        this.template = ""

        this.createChild("h1", {innerHTML: "User Metrics"});
        this.table = this.createChild(Table);

        this.table.headers = [
            {name: "User ID", dataKey: "uidShort", sortable: true, cellOnClick: (e, data, rowData) => {
                navigator.clipboard.writeText(rowData.uid);
            }, cellProps: {copyable: true}},
            {name: "Name", dataKey: "name", sortable: true, sortMethod: (a,b) => a.toLowerCase().localeCompare(b.toLowerCase())},
            {name: "Email", dataKey: "email", cellOnClick: (e, data, rowData) => {
                navigator.clipboard.writeText(data);
            }, cellProps: {copyable: true}, sortable: true},
            {name: "upcoming", dataKey: "upcoming", sortable: true},
            {name: "past", dataKey: "expired", sortable: true},
            {name: "hosted", dataKey: "hostedSessions", sortable: true},
            {name: "duration", dataKey: "hostedSessionsDuration", sortable: true, format: formatTime},
            {name: "Last Session", dataKey: "lastSession", sortable: true, format: formatDate},
            {name: "Last Sign-In", dataKey: "lastSignIn", sortable: true, format: formatDate},
            {name: "Account Created", dataKey: "userCreated", sortable: true, format: formatDate},
            {name: "Tier", dataKey: "userMaxTier", sortable: true, format: (tier, row) => (row.hasPaidLicence ? star : "") + (TIER_NAMES[tier] || "N/A")},
        ];

        this.createChild("h1", {innerHTML: "Licence Metrics", class: "top-margin"});
        this.licenceTable = this.createChild(Table);

        this.licenceTable.headers = [
            {name: "Licence ID", dataKey: "lid", sortable: true, format: shortUID, cellOnClick: (e, data, rowData) => {
                navigator.clipboard.writeText(data);
            }, cellProps: {copyable: true}},
            {name: "Licence Name", dataKey: "licenceName", sortable: true},
            {name: "Tier", dataKey: "sortTier", sortable: true, format: (_, row) => {
                let tierStr = row.tier == 0 ? `<span style='color: gray;'>${(TIER_NAMES[row.oldTier] || "N/A")}</span>` : (TIER_NAMES[row.tier] || "N/A");
                return (row.isPaid ? star : "") + tierStr
            }
            },
            {name: "Paid", dataKey: "isTest", sortable: true, format: (v) => !v ? tick : cross},
            {name: "Active", dataKey: "disabled", sortable: true, format: (v) => !v ? tick : cross},
            {name: "Seats", dataKey: "seats", sortable: true, format: (s, r) => `${r.activeUsers + r.addedUsers}/${s}`},
            {name: "Active Users", dataKey: "activeUsers", sortable: true},
        ];
    }



    onvalue(data) {
        const sessionsByUser = data.metrics.sessionsByUser;
        const licences = data.metrics.licencesById;

        const now = Date.now();        
        let tableData = []
        for (let user of data.metrics.users) {
            let sessions = sessionsByUser[user.uid] || [];
            let history = sessions.filter(s => s.isHistory);
            let scheduled = sessions.filter(s => !s.isHistory);
            let upcoming = scheduled.filter(s => s.startTime > now);
            let expired = scheduled.filter(s => s.startTime <= now);
            let lastSession = Math.max(...history.map(s => s.startTime || 0), 0);
            let userMaxTier = "max-tier" in user ? user["max-tier"] : -1;
            
            let userCreated = user.metrics?.creationTime || null;
            let lastSignIn = user.metrics?.lastSignInTime || null;  
            let email = user.metrics?.email || user.info?.email || "No Email";

            let lids = Object.keys(user.licences || {});
            let hasPaidLicence = false;
            for (let lid of lids) {
                let licence = licences[lid]
                let isPaid = !licence.isTest && !licence.disabled;
                hasPaidLicence = hasPaidLicence || isPaid;
            }

            tableData.push({
                uid: user.uid,
                uidShort: user.uidShort,
                name: user.name,
                email: email,
                scheduled: scheduled.length,
                hostedSessions: history.length,
                upcoming: upcoming.length,
                expired: expired.length,
                lastSession: lastSession,
                hostedSessionsDuration: history.reduce((a,b) => a + (b.duration || 0), 0),
                userMaxTier,
                userCreated,
                lastSignIn,
                hasPaidLicence
            });
        }
        this.table.value = tableData;

        let usersById= data.metrics.usersById;
        
        data.metrics.licences.forEach(l => {

            l.isPaid = !l.isTest && !l.disabled;
            let users = Object.keys(l.users);
             let joined = 0;
             let added = 0;
            for (let uid of users) {
                if (usersById[uid]) {
                    joined++;
                } else {
                    added++;
                }
            }
            l.sortTier = Math.max(l.oldTier || 0, l.tier) - (l.disabled ? 0.5 : 0);
            l.activeUsers = joined;
            l.addedUsers = added;
        });
        
        this.licenceTable.value = data.metrics.licences;
        
    }



}