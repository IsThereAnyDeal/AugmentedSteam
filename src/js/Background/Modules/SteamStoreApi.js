import {Errors, HTML, HTMLParser, StringUtils} from "../../modulesCore";
import {Api} from "./Api";
import {IndexedDB} from "./IndexedDB";
import CacheStorage from "./CacheStorage";

class SteamStoreApi extends Api {

    /*
     * static origin = "https://store.steampowered.com/";
     * static params = { 'credentials': 'include', };
     * static _progressingRequests = new Map();
     */

    static async fetchPackage({"key": subid}) {
        const data = await SteamStoreApi.getEndpoint("/api/packagedetails/", {"packageids": subid});
        const appids = new Map();

        for (const [subid, details] of Object.entries(data)) {
            if (details && details.success) {

                // .apps is an array of { 'id': ##, 'name': "", }
                appids.set(Number(subid), details.data.apps.map(obj => obj.id));
            } else {
                appids.set(Number(subid), null);
            }
        }
        return IndexedDB.put("packages", appids);
    }

    static async wishlistAdd(appid) {
        let res;
        const sessionid = await SteamStoreApi.sessionId();

        if (sessionid) {
            res = await SteamStoreApi.postEndpoint("/api/addtowishlist", {sessionid, appid});
        }

        if (!res || !res.success) {
            throw new Error(`Failed to add app ${appid} to wishlist`);
        }

        return SteamStoreApi.clearDynamicStore();
    }

    static async wishlistRemove(appid, sessionid) {
        let res;
        let _sessionid = sessionid;

        if (!_sessionid) {
            _sessionid = await SteamStoreApi.sessionId();
        }
        if (_sessionid) {
            res = await SteamStoreApi.postEndpoint("/api/removefromwishlist", {"sessionid": _sessionid, appid});
        }

        if (!res || !res.success) {
            throw new Error(`Failed to remove app ${appid} from wishlist`);
        }

        return SteamStoreApi.clearDynamicStore();
    }

    static async _getCurrencyFromWallet(parser) {
        const html = await SteamStoreApi.getPage("/steamaccount/addfunds");
        const doc = parser.parseFromString(html, "text/html");

        return doc.querySelector("input[name=currency]")?.value;
    }

    static async _getCurrencyFromApp(parser) {
        const html = await SteamStoreApi.getPage("/app/220");
        const doc = parser.parseFromString(html, "text/html");

        return doc.querySelector("meta[itemprop=priceCurrency][content]")?.getAttribute("content");
    }

    static async currency() {
        let currency = CacheStorage.get("currency");
        if (currency) { return currency; }

        const parser = new DOMParser();

        currency = await SteamStoreApi._getCurrencyFromWallet(parser);
        if (!currency) {
            currency = await SteamStoreApi._getCurrencyFromApp(parser);
            if (!currency) {
                throw new Error("Store currency could not be determined from app 220");
            }
        }

        CacheStorage.set("currency", currency);
        return currency;
    }

    static async sessionId() {
        const html = await SteamStoreApi.getPage("/about/");
        return HTMLParser.getVariableFromText(html, "g_sessionID", "string");
    }

    static async wishlists(path) {
        const html = await SteamStoreApi.getPage(`/wishlist${path}`);
        const data = HTMLParser.getVariableFromText(html, "g_rgWishlistData", "array");
        return data ? data.length : "";
    }

    static async purchaseDate({"params": lang}) {
        const replaceRegex = [
            /- Complete Pack/ig,
            /Standard Edition/ig,
            /Steam Store and Retail Key/ig,
            /- Hardware Survey/ig,
            /ComputerGamesRO -/ig,
            /Founder Edition/ig,
            /Retail( Key)?/ig,
            /Complete$/ig,
            /Launch$/ig,
            /Free$/ig,
            /(RoW)/ig,
            /ROW/ig,
            /:/ig,
        ];
        const purchaseDates = new Map();

        const html = await SteamStoreApi.getPage("/account/licenses/", {"l": lang});
        const dummyPage = HTML.toDom(html);
        const nodes = dummyPage.querySelectorAll("#main_content td.license_date_col");
        for (const node of nodes) {
            const name = node.nextElementSibling;
            const removeNode = name.querySelector("div");
            if (removeNode) { removeNode.remove(); }

            let appName = StringUtils.clearSpecialSymbols(name.textContent.trim());
            for (const regex of replaceRegex) {
                appName = appName.replace(regex, "");
            }
            appName = appName.trim();
            purchaseDates.set(appName, node.textContent);
        }

        return IndexedDB.put("purchases", purchaseDates);
    }

    static purchases(appName, lang) {
        return IndexedDB.get("purchases", appName, {"params": lang});
    }

    static clearPurchases() {
        return IndexedDB.clear("purchases");
    }

    static async dynamicStore() {
        const store = await SteamStoreApi.getEndpoint("dynamicstore/userdata", {}, null, {"cache": "no-cache"});
        const {rgOwnedApps, rgOwnedPackages, rgIgnoredApps, rgWishlist} = store;

        const ignored = [];
        const ignoredOwned = [];
        Object.entries(rgIgnoredApps).forEach(([appid, value]) => {
            if (value === 0) {
                ignored.push(Number(appid));
            } else if (value === 2) {
                ignoredOwned.push(Number(appid));
            }
        });

        const dynamicStore = {
            ignored,
            ignoredOwned,
            "ownedApps": rgOwnedApps,
            "ownedPackages": rgOwnedPackages,
            "wishlisted": rgWishlist,
        };

        return IndexedDB.put("dynamicStore", dynamicStore);
    }

    static dsStatus(ids) {
        return IndexedDB.getFromIndex("dynamicStore", "appid", ids, {"all": true, "asKey": true});
    }

    static async dynamicStoreRandomApp() {
        const store = await IndexedDB.getAll("dynamicStore");
        if (!store.ownedApps.length) { return null; }
        return store.ownedApps[Math.floor(Math.random() * store.ownedApps.length)];
    }

    static async clearDynamicStore() {
        await IndexedDB.clear("dynamicStore");
    }

    static appDetails(appid, filter) {
        const params = {"appids": appid};
        if (filter) { params.filters = filter; }

        return SteamStoreApi.endpointFactory("api/appdetails/", appid)(params);
    }

    static getPage(endpoint, query) {
        return super.getPage(endpoint, query, res => {
            if (new URL(res.url).pathname === "/login/") {
                throw new Errors.LoginError("store");
            }
        });
    }
}
SteamStoreApi.origin = "https://store.steampowered.com/";
SteamStoreApi.params = {"credentials": "include"};
SteamStoreApi._progressingRequests = new Map();

export {SteamStoreApi};
