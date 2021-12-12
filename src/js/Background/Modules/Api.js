import {IndexedDB} from "./IndexedDB";

class Api {

    /*
     * FF doesn't support static members
     * static origin; // this *must* be overridden
     * static params = {};
     * withResponse? use a boolean to include Response object in result?
     */
    static _fetchWithDefaults(endpoint, query = {}, params = {}) {
        const url = new URL(endpoint, this.origin);
        const _params = {...this.params, ...params};
        if (_params && _params.method === "POST" && !_params.body) {
            const formData = new FormData();
            for (const [k, v] of Object.entries(query)) {
                formData.append(k, v);
            }
            _params.body = formData;
        } else {
            for (const [k, v] of Object.entries(query)) {
                url.searchParams.append(k, v);
            }
        }
        return fetch(url, _params);
    }

    static getEndpoint(...args) { return this.fetchEndpoint("GET", ...args).then(response => response.json()); }
    static getPage(...args) { return this.fetchEndpoint("GET", ...args).then(response => response.text()); }
    static postEndpoint(...args) { return this.fetchEndpoint("POST", ...args).then(response => response.json()); }
    static deleteEndpoint(...args) { return this.fetchEndpoint("DELETE", ...args).then(response => response.json()); }

    static async fetchEndpoint(method, endpoint, query, responseFn, params = {}) {
        let _endpoint = endpoint;
        if (!endpoint.endsWith("/")) { _endpoint += "/"; } // TODO Add explanation or remove

        const response = await this._fetchWithDefaults(_endpoint, query, Object.assign(params, {method}));
        return this.responseHandler(responseFn, response);
    }

    static endpointFactory(endpoint, method = "GET") {
        return params => {
            let endpointFn;
            switch (method) {
                default: // Fall through
                case "GET": endpointFn = this.getEndpoint; break;
                case "POST": endpointFn = this.postEndpoint; break;
                case "DELETE": endpointFn = this.deleteEndpoint; break;
            }
            return endpointFn.bind(this)(endpoint, params);
        };
    }

    static endpointFactoryCached(endpoint, storeName, mapFn, method) {
        return async({params, key} = {}) => {
            let result = await this.endpointFactory(endpoint, method)(params);

            if (mapFn) {
                result = mapFn(result);
            }

            return IndexedDB.put(storeName, typeof key === "undefined" ? result : new Map([[key, result]]));
        };
    }

    static async responseHandler(responseFn, response) {
        if (typeof responseFn !== "function") { return response; }

        const mappedResponse = await responseFn(response);

        return mappedResponse ?? response;
    }
}
Api.params = {};

export {Api};
