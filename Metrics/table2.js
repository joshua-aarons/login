import { SvgPlus } from "../SvgPlus/4.js";


class TH extends SvgPlus {
    constructor(header, table) {
        super("th");
        this.props = {
            name: header.name,
            key: header.dataKey,
        }
        let d = this.createChild("div");
        d.createChild("span", {content: header.name});

        this.sortable = header.sortable;

        this.events = {
            click: (e) => {
                if (header.headerOnClick instanceof Function) {
                    header.headerOnClick(e, header);
                }
                if (header.sortable === true && header.dataKey) {
                    table.sortColumn(header, this);
                }
            }
        }
        this.header = header;
        header.th = this;
    }

    set descending(val) {
        if (val === true) {
            this.setAttribute("descending", "true");
        } else if (val === false) {
            this.setAttribute("descending", "false");
        } else {
            this.removeAttribute("descending");
        }
    }

    set sortable(val) {
        this.toggleAttribute("sortable", val === true);
    }
}

class TD extends SvgPlus {
    constructor(data, rowData, header) {
        super("td");
        let cellContent = data;
        if (header.format instanceof Function) {
            cellContent = header.format(data, rowData);
        }

        if (typeof cellContent === "string" || typeof cellContent === "number") {
            this.innerHTML = cellContent;
        } else if (cellContent instanceof Element) {
            this.appendChild(cellContent);
        } 

        if (header.cellOnClick instanceof Function) {
            this.events = {
                click: (e) => {
                    header.cellOnClick(e, data, rowData, this);
                }
            }
            this.toggleAttribute("clickable", true);
        }

        if (header.cellProps) {
            this.props = header.cellProps;
        }

        this.data = data;
        this.rowData = rowData;
        this.header = header;
    }
}

class TR extends SvgPlus {
    constructor(rd, headers) {
        super("tr");
        this.cellsByKey = {};
        this.allCells = headers.forEach(header => {
            let cell = this.createChild(TD, {}, rd[header.dataKey], rd, header)
            if (header.dataKey) {
                this.cellsByKey[header.dataKey] = cell;
            }
            return cell;
        });
        this.rowData = rd;
    }

    sortAgainst(otherRow, header) {
        let d1 = this.cellsByKey[header.dataKey].data;
        let d2 = otherRow.cellsByKey[header.dataKey].data;
        
        let rd1 = this.rowData;
        let rd2 = otherRow.rowData;
        
        let sortMethod = header.sortMethod;
        if (!(sortMethod instanceof Function)) {
            sortMethod = (a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }
        }

        return sortMethod(d1, d2, rd1, rd2);
    }
}

/**
 * @typedef {Object} TableHeaders
 * @property {?string} dataKey - The data key for the header (if applicable)
 * @property {string} name - The name for the header i.e. whats displayed
 * @property {boolean} [sortable] - Whether the column is sortable
 * @property {Function} [sortMethod] - The method used to sort the column
 * @property {Function} [headerOnClick] - The callback when the header is clicked
 * @property {Function} [format] - The method used to format the data in the column
 * @property {Function} [cellOnClick] - The callback when a cell in the column is clicked
 * 
 */
export class Table extends SvgPlus {
    constructor() {
        super("table-plus");
        this._headers = [];
        this._data = [];
        this.table = this.createChild("table");
    }

    /** 
     * @param {TableHeaders[]} headers
     */
    set headers(headers) {
        this._headers = headers;
        this._renderTable();
    }
    get headers() {
        return this._headers;
    }

    set value(data) {
        this._data = data;
        this._renderTable();
    }
    get value() {
        return this._data;
    }

    filterRows(filterFunc) {
        this._rows.forEach(row => {
            if (filterFunc(row.rowData)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
        this._filterFunc = filterFunc;
    }

    sortColumn(header, toggleAscending=true) {
        if (!header.dataKey || !header.sortable) return;

        // Toggle descending on the header and remove it from all other headers
        this.headers.forEach(h => {
            if (h !== header) {
                delete h.descending;
                if (h.th) {
                    h.th.descending = undefined;
                }
            }
        });

        if (toggleAscending) {
            header.descending = !header.descending;
        }
        if (header.th) {
            header.th.descending = header.descending;
        }

        // Default sort method
        let sortMethod = header.sortMethod;
        if (!(sortMethod instanceof Function)) {
            sortMethod = (a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }
        }
        
        // Sort the rows
        let direction = header.descending ? -1 : 1
        this._rows.sort((a, b) => {
            return direction * a.sortAgainst(b, header);
        });

        // Re-render the tbody
        for (let row of this._rows) {
            this._tbody.appendChild(row);
        }
    }

    _renderTable() {
        const {table} = this;
        table.innerHTML = "";
        const thead = table.createChild("thead");
        const hrow = thead.createChild("tr");

        this.headers.forEach(h => hrow.createChild(TH, {}, h, this));
        this._tbody = this.table.createChild("tbody");
        this._rows = this._data.map(rd => this._tbody.createChild(TR, {}, rd, this.headers));
        
        // Sort by any previously sorted columns
        this.headers.forEach(h => {
            if (h.descending !== undefined) {
                this.sortColumn(h, false);
            }
        });
        if (this._filterFunc instanceof Function) {
            this.filterRows(this._filterFunc);
        }
    }
}