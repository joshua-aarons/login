import { SvgPlus, CustomForm } from "../CustomComponent.js"
import { useCSSStyle } from "../template.js";

useCSSStyle("table-plus");
useCSSStyle("theme")

export async function loadCSV() {
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
            entry[data[0][j].toLowerCase()] = data[i][j]
        }
        data2.push(entry)
    }
    return data2

}

class TablePlus extends SvgPlus {

    onconnect() {
        // create search bar
        let s = this.createChild('section', {class:'table__header'})
        this.titleel = s.createChild('h1',{content:'table-name'})
        let ig = s.createChild('div', {class:'input-group'})
        let searchinput = ig.createChild('input', {name:'searchbar',type:'search',placeholder:'Search...'})
        searchinput.addEventListener("input", () => {
            this.search(searchinput.value)
        })
        ig.createChild('img', {src:"images/search.png"})

        // create export file
        let ef = s.createChild('div', {class:'export__file'})
        let eb = ef.createChild('label', {class:'export__file-btn',title:'Export File', content: '<i class="fa-solid fa-file-export"></i>'})
        eb.onclick = (e) => {
            this.toggleAttribute('show-options')
            e.stopPropagation()
        }
        let efo = ef.createChild('div', {class:'export__file-options'})
        efo.createChild('label', {content:'Export As &nbsp; &#10140;'})
        for (let option of ['PDF','CSV']){
            let op = efo.createChild('label',{content:`${option} <img src="images/${option.toLowerCase()}.png" alt="">`})
            op.onclick = (e) => {
                this['convert' + option]()
                this.toggleAttribute('show-options', false)
                e.stopPropagation()
            }
        }
        window.addEventListener('click', () => {this.toggleAttribute('show-options', false)})

        // create table
        let s2 = this.createChild("section", {class:'table__body'})
        this.table = s2.createChild("table")
        this.thead = this.table.createChild("thead")
        this.headrow = this.thead.createChild("tr")
        this.tbody = this.table.createChild("tbody")
    }

    set tools(tools) {
        let ptools = [];
        if (Array.isArray(tools)) {
            for (let tool of tools) {
                let t = {};
                if (tool !== null && typeof tool === "object") {
                    for (let key of ["name", "icon"]) {
                        if (key in tool) t[key] = tool[key]
                        else t[key] = key
                    }
                    if ("method" in tool) {
                        if (tool.method instanceof Function) t.method = tool.method;
                        else if (this[tool.method] instanceof Function) t.method = (e) => this[tool.method](e);
                        
                    } else t.method = ()=>{};
                    ptools.push(t)
                }
            }
        }
        this._tools = ptools
    }

    get tools(){
        let tools = this._tools;
        if (!Array.isArray(tools)) tools = []
        return tools;
    }

    set parseValue(parser){
        if(parser instanceof Function) this._parseValue = parser;
    }
    get parseValue(){
        if (this._parseValue instanceof Function) return this._parseValue;
        else return v => v;
    }

    set getSortValue(getSortValue){
        if(getSortValue instanceof Function) this._getSortValue = getSortValue;
    }
    get getSortValue(){
        if (this._getSortValue instanceof Function) return this._getSortValue;
        else return (cell) => {
            let sv = cell.textContent.toLowerCase();
            return sv;
        }
    }

    /**
     * @param {String} value
     */
    set titleName(value) {
        this.titleel.innerHTML = value
    }

    /**
     * @param {[{}]} value
     */
    set value(value) {
        // parse value extra function
        value = this.parseValue(value)

        // Set headers if none have been set
        if (!Array.isArray(this.headers)) {
            this.headers = Object.keys(value[0]);
        }
        let headers = this.headers;

        // Construct Table
        this.tbody.innerHTML = ""
        for (let row of value) {
            let tr = this.tbody.createChild("tr")
            tr.value = row
            let i = 0;
            for (let key of headers) {
                let content = row[key];
                let contentValue = typeof content === "string" ? content.toLowerCase() : content;
                tr.setAttribute(key,content)
                let cell = tr.createChild('td', { key: key, value: contentValue,  content: `<p>${content}</p>`});
                cell.key = key;
                cell.value = content;
                cell.index = i; 
                i++;
            }

            for (let {method, icon, name} of this.tools) {
                let cell = tr.createChild('td', {key: "tool", value: name, content: `<p>${icon}</p>`});
                cell.onclick = () => method(cell);
            }
        }
    }

    deleteRow(e){
        e.parentNode.remove();
    }

    
    /**
     * @param {[""]} headers
     */
    set headers(headers) {
        this._headers = [...headers];
        let tr = this.headrow
        tr.innerHTML = ""
        let i = 0
        for (let head of headers) {
            let j = i
            let th = tr.createChild('th', { content: head + `<span><i class="fa-solid fa-caret-down"></i></span>` });
            th.onclick = () => {
                this.sort(j)
            }
            th.value = head
            i++
        }
        for (let tool of this.tools) tr.createChild("th")
    }
    get headers(){return this._headers;}


    getSortingValue(cell){
        return 
    }


    sort(i) {
        let headers = [...this.headrow.children]
        let rows = [...this.tbody.children]
        headers.forEach(head => head.classList.remove('active'));
        headers[i].classList.add('active');

        this.table.setAttribute('sort', headers[i].value)
        let sort_asc = headers[i].classList.contains('asc') ? false : true;
        headers[i].classList.toggle('asc', sort_asc);
        this.table.querySelectorAll('td').forEach((e) => {e.classList.remove('active')})
        rows.forEach((e) => {e.children[i].classList.add('active')})

        let getSortValue = this.getSortValue;
        [...this.tbody.children].sort((a, b) => {
            let first_row = getSortValue(a.querySelectorAll('td')[i]),
                second_row = getSortValue(b.querySelectorAll('td')[i]);

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
        a.download = `${this.titleel.textContent.replace(/\s*$/g, "")}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);  
        // setTimeout(function() {
        //     document.body.removeChild(a);
        // }, 0); 
    }
}

SvgPlus.defineHTMLElement(TablePlus);