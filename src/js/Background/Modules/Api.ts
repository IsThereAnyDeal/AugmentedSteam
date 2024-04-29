import {Errors} from "../../modulesCore";

export default abstract class Api {

    private readonly origin: string;

    constructor(origin: string) {
        this.origin = origin;
    }

    protected getApiUrl(path: string, query: Record<string, string|number|undefined> = {}): URL {
        let url = new URL(path, this.origin);
        for (let [key, value] of Object.entries(query)) {
            if (value === undefined) {
                continue
            }
            url.searchParams.set(key, String(value));
        }
        return url
    }

    protected async fetchJson<T>(
        url: string|URL,
        init: RequestInit = {}
    ): Promise<T> {
        let response = await fetch(url, init);

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        return await response.json();
    }

    protected async fetchText(
        url: string|URL,
        init: RequestInit = {}
    ): Promise<string> {
        let response = await fetch(url, init);

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        return await response.text();
    }





    static async getEndpoint(endpoint, query, responseHandler, params = {}) {
        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "GET"}));
        if (responseHandler) {
            responseHandler(response);
        }
        if (response.status !== 200) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }
        return response.json();
    }

    static async getPage(endpoint, query, params = {}) {
        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "GET"}));
        return response.text();
    }

    static async postEndpoint(endpoint, query, params = {}) {
        const response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, {"method": "POST"}));
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
            }
            return result;
        };
    }

    static endpointFactoryCached(endpoint, storeName, mapFn) {
        return async({params, key} = {}) => {
            let result = await this.getEndpoint(endpoint, params);

            if (mapFn) {
                result = mapFn(result);
            }

            return IndexedDB.put(storeName, typeof key === "undefined" ? result : new Map([[key, result]]));
        };
    }
}

