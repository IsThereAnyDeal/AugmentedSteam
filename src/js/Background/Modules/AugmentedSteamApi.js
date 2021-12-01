import {Errors} from "../../Core/Errors/Errors";
import {IndexedDB} from "./IndexedDB";
import Config from "../../config";
import {Api} from "./Api";
import {Redirect} from "./Redirect";

class AugmentedSteamApi extends Api {

    /*
     * static origin = Config.ApiServerHost;
     * static _progressingRequests = new Map();
     */

    static authenticate() {
        const endpoint = (new URL("api/login.v01.php", this.origin)).toString();
        const redirectURL = (new URL("connectaugmentedsteam", this.origin)).toString();
        return Redirect.waitForRedirect(endpoint, redirectURL);
    }

    static fetchEndpoint(method, endpoint, query, responseFn, params = {}) {

        const _responseFn = async response => {
            const newResponse = await this.responseHandler(responseFn, response);

            if (newResponse.status === 500) {
    
                // FIXME 500 doesn't only signal this error
                /*
                 * Beautify HTTP 500: "User 'p_enhsteam' has exceeded the 'max_user_connections' resource (current value: XX)",
                 * which would result in a SyntaxError due to JSON.parse
                 */
                throw new Errors.ServerOutageError(
                    `Augmented Steam servers are currently overloaded, failed to fetch endpoint "${endpoint}"`
                );
            }
            return newResponse;
        };

        return super.fetchEndpoint(method, endpoint, query, async response => {
            const newResponse = await this.responseHandler(_responseFn, response);

            if (newResponse.status === 401) { // Not logged in, authenticate and try again
                await this.authenticate();
                return super.fetchEndpoint(method, endpoint, query, _responseFn, params);
            }

            return newResponse;
        }, params);
    }

    static async getEndpoint(...args) { return this.jsonCheck(await super.getEndpoint(...args)); }
    static async postEndpoint(...args) { return this.jsonCheck(await super.postEndpoint(...args)); }
    static async deleteEndpoint(...args) { return this.jsonCheck(await super.deleteEndpoint(...args)); }

    static jsonCheck(json) {
        if (json?.result !== "success") {
            throw new Error("Endpoint not successfully retrieved");
        }
        delete json.result;
        return json;
    }

    static storePageData(appid, metalink, showoc) {
        const params = {"appid": appid};
        if (metalink) { params.mcurl = metalink; }
        if (showoc) { params.oc = 1; }
        return IndexedDB.get("storePageData", appid, {params});
    }

    static expireStorePageData(appid) {
        return IndexedDB.delete("storePageData", `app_${appid}`);
    }

    static rates(to) {
        return IndexedDB.getAll("rates", {"params": {"to": to.sort().join(",")}});
    }

    static clearRates() {
        return IndexedDB.clear("rates");
    }

    static isEA(appids) {
        return IndexedDB.contains("earlyAccessAppids", appids);
    }

    static steamPeek(appid) {
        return AugmentedSteamApi.endpointFactory("v01/similar")({appid, "count": 15});
    }
}
AugmentedSteamApi.origin = Config.ApiServerHost;
AugmentedSteamApi._progressingRequests = new Map();

export {AugmentedSteamApi};
