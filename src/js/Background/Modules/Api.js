import {IndexedDB} from "./IndexedDB";

class Api {

    /*
     * FF doesn't support static members
     * static origin; // this *must* be overridden
     * static params = {};
     * withResponse? use a boolean to include Response object in result?
     */
    static _fetchWithDefaults(endpoint, query = {}, params = {}) {
        // AS APIs require trailing slash
        const _endpoint = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
        const url = new URL(_endpoint, this.origin);
        const _params = {...this.params, ...params};
        if (_params.method === "POST" && !_params.body) {
            _params.body = new URLSearchParams(query);
        } else {
            url.search = new URLSearchParams(query).toString();
        }
        return fetch(url, _params);
    }

    static async getEndpoint(endpoint, query, responseHandler, params = {}) {
        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "GET"}));
        if (responseHandler) { responseHandler(response); }
        return response.json();
    }

    static async getPage(endpoint, query, responseHandler, params = {}, crossDomain = false) {
        if (crossDomain) {

            /**
             * Pretend we're doing normal navigation to trigger the login flow in case the user's JWT token has expired.
             * See https://github.com/SteamDatabase/BrowserExtension/blob/27da70af9391026ef194b09e70aaf2bbb302e067/scripts/background.js#L106-L110
             */
            Object.assign(params, {"headers": {"Accept": "text/html"}});
        }

        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "GET"}));
        if (responseHandler) { responseHandler(response); }
        return response.text();
    }

    static async postEndpoint(endpoint, query, responseHandler, params = {}) {
        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "POST"}));
        if (responseHandler) { responseHandler(response); }
        return response.json();
    }

    static async deleteEndpoint(endpoint, query, responseHandler, params = {}) {
        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "DELETE"}));
        if (responseHandler) { responseHandler(response); }
        return response.json();
    }

    static endpointFactory(endpoint, objPath) {
        return async params => {
            let result = await this.getEndpoint(endpoint, params);
            if (objPath) {
                if (Array.isArray(objPath)) {
                    for (const part of objPath) {
                        result = result[part];
                    }
                } else {
                    result = result[objPath];
                }
            } else {
                result = result.data;
            }
            return result;
        };
    }

    static endpointFactoryCached(endpoint, storeName, mapFn) {
        return async({params, key} = {}) => {
            let result = await this.getEndpoint(endpoint, params);

            if (mapFn) {
                result = mapFn(result.data);
            } else {
                result = result.data;
            }

            return IndexedDB.put(storeName, typeof key === "undefined" ? result : new Map([[key, result]]));
        };
    }
}
Api.params = {};

export {Api};
