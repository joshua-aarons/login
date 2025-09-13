
export class RouteQuery {
    constructor(location, params, origin) {
        this.origin = origin || window.origin;
        this.location = typeof location === "string" ? location : (location + "");
        if (!params || !Array.isArray(params)) {
            this.params = typeof params === "string" ? [params] : [];
        }
        this.params = params;
    }
 
    get paramsString() {
        let keys = Object.keys(this.params);

        if (keys.length > 0) {
            return "?" + keys.map(key => {
                return encodeURIComponent(key) + "=" + encodeURIComponent(this.params[key]);
            }).join("&");
        } else {
            return "";
        }
    }

    toString() {
        return `#${encodeURIComponent(this.location)}${this.paramsString}`;
    }


    getFullURL(urlPath) {
        let url = urlPath ? `${this.origin}/${urlPath}/${this}` : `${this.origin}/${this}`;
        return url;
    }

    setLocation(location) {
        if (location) {
            window.location = this.getFullURL(location);
        } else {
            window.location.hash = this + "";
        }
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
        str = str.replace(/^#/, "");

        let [hash, paramStr] = str.split("?"); // Remove query parameters if any
        if (!hash || hash.length == 0) {
            hash = defaultPath;
        } else {
            hash = decodeURIComponent(hash);
        }

        let params = {}
        if (paramStr && paramStr.length > 0) {
             [...paramStr.matchAll(/([^=&]+)=([^&]+)/g)].forEach(([_, key, value]) => {
                key = decodeURIComponent(key);
                value = decodeURIComponent(value);
                if (key.length > 0) {
                    params[key] = value;
                }
            })
        }

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