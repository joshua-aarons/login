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

class TablePlus extends SvgPlus {
    async loadcsv() {
        let csv = await loadCSV()
        console.log(csv)
        this.value = csv
        localStorage.setItem("csv", JSON.stringify(csv))
    }
    set titlename(value) {
        this.titleel.innerHTML = value
    }
    onconnect() {
        // create search bar
        let s = this.createChild('section', {class:'table__header'})
        this.titleel = s.createChild('h1',{content:'table-name'})
        let ig = s.createChild('div', {class:'input-group'})
        let searchinput = ig.createChild('input', {name:'searchbar',type:'search',placeholder:'Search Data...'})
        searchinput.addEventListener("input", () => {
            this.search(searchinput.value)
        })
        ig.createChild('img', {src:"images/search.png"})

        // create export file
        let ef = s.createChild('div', {class:'export__file'})
        let eb = ef.createChild('label', {class:'export__file-btn',title:'Export File'})
        eb.onclick = () => this.toggleAttribute('show-options')
        let efo = ef.createChild('div', {class:'export__file-options'})
        efo.createChild('label', {content:'Export As &nbsp; &#10140;'})
        for (let option of ['PDF','CSV']){
            let op = efo.createChild('label',{content:`${option} <img src="images/${option.toLowerCase()}.png" alt="">`})
            op.onclick = () => {
                this['convert' + option]()
                this.toggleAttribute('show-options', false)
            }
        }

        // create table
        let s2 = this.createChild("section", {class:'table__body'})
        this.table = s2.createChild("table")
        this.thead = this.table.createChild("thead")
        this.headrow = this.thead.createChild("tr")
        this.tbody = this.table.createChild("tbody")
    }
    set value(value) {
        if (this.parseValue instanceof Function)
            value = this.parseValue(value)
        this.tbody.innerHTML = ""
        this.headers = Object.keys(value[0])
        for (let row of value) {
            let tr = this.tbody.createChild("tr")
            for (let key in row) {
                let content = row[key]
                if (key.toLowerCase() == "status")
                    content = `<p class="status ${content.toLowerCase()}">${content}</p>`
                tr.createChild('td', { content })
            }
        }
    }
    set headers(headers) {
        let tr = this.headrow
        tr.innerHTML = ""
        let i = 0
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

SvgPlus.defineHTMLElement(TablePlus);