import {IndexedDB} from "./IndexedDB";
import Config from "../../config";
import {Api} from "./Api";

class AugmentedSteamApi extends Api {

    /*
     * static origin = Config.ApiServerHost;
     * static _progressingRequests = new Map();
     */

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
