import {Errors} from "../../Core/Errors/Errors";
import {IndexedDB} from "./IndexedDB";
import Config from "../../config";
import {Api} from "./Api";

class AugmentedSteamApi extends Api {

    /*
     * static origin = Config.ApiServerHost;
     * static _progressingRequests = new Map();
     */

    static async getEndpoint(endpoint, query) { // withResponse? boolean that includes Response object in result?
        const json = await super.getEndpoint(endpoint, query, response => {
            if (response.status === 500) {

                /*
                 * Beautify HTTP 500: "User 'p_enhsteam' has exceeded the 'max_user_connections' resource (current value: XX)",
                 * which would result in a SyntaxError due to JSON.parse
                 */
                throw new Errors.ServerOutageError(
                    `Augmented Steam servers are currently overloaded, failed to fetch endpoint "${endpoint}"`
                );
            }
        });
        if (!json.result || json.result !== "success") {
            throw new Error(`Could not retrieve '${endpoint}'`);
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
