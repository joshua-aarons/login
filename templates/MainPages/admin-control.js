import {SvgPlus, UserDataComponent } from "../../CustomComponent.js";
import { addUsersToLicence, removeUsersFromLicence } from "../../Firebase/New/licences.js";
import { getHTMLTemplate, useCSSStyle } from "../../template.js"
import { loadCSV } from "../table-plus.js"


useCSSStyle("theme");

const valueParsers = {
    "name": (value) => value || "unknown",
    "email": (value) => value || "unknown",
    "status": (value) => value || "error",
    "id": (value, i) => i+1,
    "linked": (value) => value ? "<i class='fa-solid fa-check'></i>" : "<i class='fa-solid fa-xmark'></i>",
}
function parseMembers(users) {
    return users.map((user, i) => {
        let parsedUser = {};
        for (let key in valueParsers) {
            parsedUser[key] = valueParsers[key](user[key], i);
        }
        return parsedUser;
    })
}

class AdminControl extends UserDataComponent {
    licencesByID = {};
    selectedLicenceUsers = [];
    _selectedLicenceID = null;

    onconnect() {
        this.template = getHTMLTemplate("admin-control");
        this.style_el = this.createChild('style')
        
        let { members, download } = this.els;

        members.titleName = "Members";
        members.parseValue = parseMembers;
        members.tools = [
            {
                icon: `<i class="fa-solid fa-trash"></i>`, 
                name: "delete", 
                method: (cell) => {
                    let row = cell.parentNode;
                    let user = row.value;
                    row.styles = {
                        "pointer-events":"none",
                        "opacity": 0.5,
                    }
                    removeUsersFromLicence(this.selectedLicenceID, [user]);
                }
            },
            {
                name: "edit",
                icon: `<i class="fa-solid fa-pen-to-square"></i>`,
                method: (cell) => {
                    let row = cell.parentNode;
                    let user = row.value;
                    this.showAddUserForm(user);
                }
            }
        ]
        members.headers = ["id", "linked", "name", "email", "status"]

        let lastHeadCell = members.querySelector("thead tr th:last-of-type");
        lastHeadCell.innerHTML += `<i class="fa-solid fa-user-plus"></i>`;
        lastHeadCell.addEventListener("click", () => {
            this.showAddUserForm();
        });
       
        download.addEventListener("click", () => {
            let link = new SvgPlus("a")
            link.props = { href: "./templates/template-members-page.csv" };
            link.toggleAttribute("download", true)
            link.click()
        })

        let select = this.els.licenceSelect;
        select.addEventListener("change", (e) => {
            this.selectedLicence = select.value;
        })

        this.attachEvents();
        let els = this.els.userForm.getElementLibrary();
        this.els.submitButton = els.submitButton;
        this.els.userForm.hideAddUserForm = this.hideAddUserForm.bind(this);
        this.els.userForm.addNewUser = this.addNewUser.bind(this);
        this.els.userForm.attachEvents();
    }


    showAddUserForm(value = null) {
        let form = this.els.userForm;
        form.value = value;
        this.els.titleEl.innerHTML = value == null ? "Add User" : "Edit User";
        this.els.submitButton.innerHTML = value == null ? "Add User" : "Save Changes";
        this.els.addUserForm.classList.add("open");
        this.editOrAdd = value == null ? "Added" : "Edited";
    }

    hideAddUserForm() {
        this.value = null;
        this.els.addUserForm.classList.remove("open");
    }

    async addNewUser(){
        let form = this.els.userForm;
        if (form.validate()) {
            form.classList.add("disabled");
            let data = form.value;
            let res = await addUsersToLicence(this.selectedLicenceID, [data]);
            if (res[0].errors.length > 0) {
                console.log(`${this.editOrAdd} new user "${data.name}" failed with errors:\n\t${res[0].errors.join("\n\t")}`);
            } else {
                console.log(`${this.editOrAdd} new user "${data.name}" successfully`);
            }
            form.classList.remove("disabled");
            this.hideAddUserForm();
        }
    }
   

    /** 
     * Sets the selected licence by ID.
     * @param {string} id - The ID of the licence to select.
     */
    set selectedLicence(id) {
        this._selectedLicenceID = id;
        let seats = 0;
        let users = [];

        const {licencesByID} = this;
        if (id in licencesByID) {
            const selectedLicence = licencesByID[id];
            console.log(`Showing selected licence:\n\tid:  ${id}\n\tname: ${selectedLicence.licenceName}`);

            if (selectedLicence?.users) {
                users = Object.keys(selectedLicence.users).map((id) => {
                    let {email, name, status, linked} = selectedLicence.users[id];
                    return { id, email, name, status, linked };
                });
            }
            if (selectedLicence?.seats) seats = selectedLicence.seats;

        } else {
            console.warn(`Licence with ID ${id} not found in licencesByID.`);
        }

        let mcount = users.length;
        this.els.members.value = users
        this.selectedLicenceUsers = users;
        this.value = {memberscount: mcount, memberspercent: seats == 0 ? 0 : mcount/seats}
        this.els.maxUserInfo.setAttribute("hover", `A total of <b>${mcount}</b> users out of <b>${seats}</b> maximum users.`)
    }

    get selectedLicence() {
        return this._selectedLicenceID || null;
    }

    get selectedLicenceID() {
        return this._selectedLicenceID || null;
    }


    /**
     * Updates the licence selection dropdown with the provided licences.
     * @param {{id:string, name: string, seats: number}[]} licences - An array of licence objects to populate the selection.
     * Each licence object should have an `id`, `licenceName`, and `seats` property.
     */
    updateLicenceSelectionList(licences) {
        let select = this.els.licenceSelect;
        select.innerHTML = "";
        licences.forEach(element => {
            let option = new SvgPlus("option");
            option.props = {
                value: element.id,
                innerHTML: `${element.licenceName} (${element.seats} seats)`,
            }
            select.appendChild(option);
        });
        select.value =  this.selectedLicenceID;
    }

    updateLicences(value) {
        if ("licences" in value) {
            let licences = value.licences;
            this.licencesByID = value.licencesByID || {};
            if (!Array.isArray(value.licences)) {
                licences = [];
            }

            // Update the current licence selected. 
            // If there are no licences, set the last selected to null.
            // If there are licences, set the last selected to 
            // the first licence or the last selected licence.
            let lastSelected = this.selectedLicenceID;
            if (licences.length == 0) {
                lastSelected = null;
            } else if (lastSelected == null) {
                lastSelected = licences[0].id;
            }

            this.selectedLicence = lastSelected;
            this.updateLicenceSelectionList(licences);
        }
    }

    onvalue(value){
        if (value) {
            if (value.info && value.info.email) {
                let {email} = value.info;
                this.email = email;
                this.displayName = value.info.displayName ? value.info.displayName : value.info.firstName;
                this.style_el.innerHTML = `tr[email='${email}'] td[key='tool'] {color: rgba(115, 128, 236, 0.5); pointer-events: none;}`
            }

            this.updateLicences(value);
        }
    }

    hideInvalidCSVPopup(){
        this.els.invalidCSVPopup.classList.remove("open")
    }

    async loadCSVAdmins(){
        const maxUsers = 25;
        const validStatus = {"admin": true, "staff": true};
        let {members, invalidCSVPopup, errorCSV} = this.els;
        const exp = /^[^@]+@\w+(\.\w+)+\w$/

        invalidCSVPopup.classList.remove("open")

        let csv = await loadCSV()
        // check format 
        // update database
        let parsedCSV = []
        let error = false;
        if (csv.length <= maxUsers) {
            for (let i = 0; i < csv.length; i++){
                let {name, email, status} = csv[i];
                if (!name || !email || !status) {
                    error = "The table is missing the required fields."
                } else {
                    if (!exp.test(email)) {
                        error = `The email <i>'${email}'</i> on row ${i+2} is invalid.`
                    }
                    
                    status = status.toLowerCase();
                    if (!(status in validStatus)) {
                        error = `The status <i>'${status}'</i> on row ${i+2} is not a valid status (admin/staff).`
                    }
                }
    
                if (error) {
                    break;
                } else {
                    if (email != this.email) {
                        parsedCSV.push({name, email, status})
                    }
                }
            }
        } else {
            error = `This table has ${csv.length} rows but only ${maxUsers} are allowed.`
        }
        if (error) {
            errorCSV.innerHTML = error;
            invalidCSVPopup.classList.add("open");
        } else {
            let users = parsedCSV.filter((v) => v.email != this.email);
            let currentUsers = (this.selectedLicenceUsers || []).filter((v) => v.email != this.email);
            let usersToRemove = currentUsers.filter((v) => !users.some((u) => u.email == v.email));
            addUsersToLicence(this.selectedLicenceID, users);
            removeUsersFromLicence(this.selectedLicenceID, usersToRemove);
            members.value = parsedCSV;
        }
    }
}

SvgPlus.defineHTMLElement(AdminControl);