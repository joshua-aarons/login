
export class RouteQuery {
    constructor(location, params) {
        this.location = typeof location === "string" ? location : location.toString();
        if (!params || !Array.isArray(params)) {
            this.params = typeof params === "string" ? [params] : [];
        }
        this.params = params;
    }

    get paramsString() {
        return this.params.length > 0 ? "?" + this.params.join("&") : "";
    }

    toString() {
        return "#" + this.location + this.paramsString;
    }

    setLocation() {
        window.location.hash = this + "";
    }

    static parse(arg1, arg2) {
        if (arg1 instanceof RouteQuery) {
            return arg1;
        } else if (typeof arg1 === "string") {
            return RouteQuery.parseHashString(arg1, arg2);
        } else {
            return RouteQuery.fromWindow()
        }
    }
        
    static parseHashString(str, defaultPath) {
        let hash = str.replace(/^#/, "");
        let params = hash.split("?"); // Remove query parameters if any
        hash = params.shift();
        if (hash.length == 0) hash = defaultPath;
        return new RouteQuery(hash, params);
    }

    static fromWindow(defaultPath) {
        return RouteQuery.parseHashString(window.location.hash, defaultPath);
    }
}

export function onLocationChange(callback, defaultPath) {
    window.addEventListener("hashchange", (e) => {
        callback(RouteQuery.fromWindow(defaultPath));
    });
}