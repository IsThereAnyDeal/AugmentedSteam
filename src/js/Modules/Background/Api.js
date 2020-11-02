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

    static async getEndpoint(endpoint, query, responseHandler, params = {}) {
        let _endpoint = endpoint;
        if (!endpoint.endsWith("/")) { _endpoint += "/"; }

        const response = await this._fetchWithDefaults(_endpoint, query, Object.assign(params, {"method": "GET"}));
        if (responseHandler) { responseHandler(response); }
        return response.json();
    }

    static async getPage(endpoint, query, responseHandler, params = {}) {
        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "GET"}));
        if (responseHandler) { responseHandler(response); }
        return response.text();
    }

    static async postEndpoint(endpoint, query, responseHandler, params = {}) {
        let _endpoint = endpoint;
        if (!endpoint.endsWith("/")) { _endpoint += "/"; }

        const response = await this._fetchWithDefaults(_endpoint, query, Object.assign(params, {"method": "POST"}));
        if (responseHandler) { responseHandler(response); }
        return response.json();
    }

    static async deleteEndpoint(endpoint, query, responseHandler, params = {}) {
        let _endpoint = endpoint;
        if (!endpoint.endsWith("/")) { _endpoint += "/"; }

        const response = await this._fetchWithDefaults(_endpoint, query, Object.assign(params, {"method": "DELETE"}));
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
