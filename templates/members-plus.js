import { SvgPlus, CustomForm } from "../CustomComponent.js"
import { useCSSStyle } from "../template.js";

useCSSStyle("members-plus");
useCSSStyle("theme")

async function loadCSV() {
    let input = new SvgPlus("input")
    input.setAttribute("type", "file")
    return new Promise((resolve, reject) => {
        input.addEventListener("change", e => {
            if (input.files.length > 0) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    resolve(parseCSV(evt.target.result));
                };
                reader.readAsText(input.files[0]);
            }
        })
        input.click()
    })
}

function parseCSV(csv) {
    let data = []
    for (let row of csv.split(/\r*\n\r*/)) {
        if (row != '')
            data.push(row.split(/,\s*/))
    }
    let data2 = []
    for (let i = 1; i < data.length; i++) {

        let entry = {}
        for (let j = 0; j < data[0].length; j++) {
            entry[data[0][j]] = data[i][j]
        }
        data2.push(entry)
    }
    return data2

}

class MembersPlus extends SvgPlus {
    async loadcsv() {
        let csv = await loadCSV()
        console.log(csv)
        this.value = csv
        localStorage.setItem("csv", JSON.stringify(csv))
    }
    onconnect() {
        // let uploadBtn = this.createChild("div", {class:"btn", content:"open-csv"})
        // uploadBtn.onclick = () => {this.loadcsv()}
        this.table = this.createChild("table")
        this.thead = this.table.createChild("thead")
        this.headrow = this.thead.createChild("tr")
        this.tbody = this.table.createChild("tbody")
        let csv = localStorage.getItem("csv")
        try {
            csv = JSON.parse(csv)
            this.value = csv
        } catch (e) { }
    }
    set value(value) {
        this.tbody.innerHTML = ""
        let j = 1
        this.headers = Object.keys(value[0])
        for (let row of value) {
            let tr = this.tbody.createChild("tr")
            tr.createChild('td', { content: j })
            for (let key in row) {
                let content = row[key]
                if (key.toLowerCase() == "status")
                    content = `<p class="status ${content.toLowerCase()}">${content}</p>`
                tr.createChild('td', { content })
            }
            j++
        }
    }
    set headers(headers) {
        let tr = this.headrow
        tr.innerHTML = ""
        let i = 0
        headers.unshift("Id")
        for (let head of headers) {
            let j = i
            let th = tr.createChild('th', { content: head + `<span><i class="fa-solid fa-caret-down"></i></span>` })
            th.onclick = () => {
                this.sort(j)
            }
            i++
        }
    }
    sort(i) {
        let headers = [...this.headrow.children]
        let rows = [...this.tbody.children]
        console.log(i, headers, rows)
        headers.forEach(head => head.classList.remove('active'));
        headers[i].classList.add('active');

        this.querySelectorAll('td').forEach(td => td.classList.remove('active'));
        rows.forEach(row => {
            row.querySelectorAll('td')[i].classList.add('active');
        })
        let sort_asc = headers[i].classList.contains('asc') ? false : true;
        headers[i].classList.toggle('asc', sort_asc);

        [...this.tbody.children].sort((a, b) => {
            let first_row = a.querySelectorAll('td')[i].textContent.toLowerCase(),
                second_row = b.querySelectorAll('td')[i].textContent.toLowerCase();

            return sort_asc ? (first_row < second_row ? 1 : -1) : (first_row < second_row ? -1 : 1);
        })
            .map(sorted_row => this.tbody.appendChild(sorted_row));
    }
    search(search) {
        let rows = [...this.tbody.children]
        let j = 0
        rows.forEach((row, i) => {
            let table_data = row.textContent.toLowerCase(),
                search_data = search.toLowerCase();

            let ishidden = table_data.indexOf(search_data) < 0
            if (!ishidden) {
                row.style.backgroundColor = (j % 2 == 0) ? 'transparent' : '#0000000b';
                j++
            }
            row.classList.toggle('hide', ishidden);

            row.style.setProperty('--delay', i / 25 + 's');
        })

        // this.querySelectorAll('tbody tr:not(.hide)').forEach((row, i) => {
        // });
    }
    convertPDF() {
        const html_code = `
    <!DOCTYPE html>
    <head>
    <link rel="stylesheet" type="text/css" href="./templates/members-plus.css">
    <link rel="stylesheet" type="text/css" href="./templates/theme.css">

    </head>
    <body>
    <div class="card" id="customers_table">${this.table.outerHTML}</div>
    </body>`;

        const new_window = window.open();
        new_window.document.write(html_code);

        setTimeout(() => {
            new_window.print();
            new_window.close();
        }, 400);
    }
    convertCSV(){
        let heads = [...this.headrow.children]
        let rows = [...this.tbody.children]
        let text = rows.map((row) => [...row.children].map((cell) => cell.textContent).join(","))
        text.unshift(heads.map((cell) => cell.textContent).join(","))
        text = text.join("\n")
        var file = new Blob([text], {type: "csv"});
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = "members.csv";
        a.click();
        window.URL.revokeObjectURL(url);  
        // setTimeout(function() {
        //     document.body.removeChild(a);
        // }, 0); 
    }
}

SvgPlus.defineHTMLElement(MembersPlus);