import {Errors, GameId, HTMLParser, LocalStorage} from "../../modulesCore";
import {Api} from "./Api";
import CacheStorage from "./CacheStorage";
import {IndexedDB} from "./IndexedDB";

class SteamCommunityApi extends Api {

    /*
     * static origin = "https://steamcommunity.com/";
     * static params = { 'credentials': 'include', };
     */

    static cards(appid, border) {
        return SteamCommunityApi.getPage(`/my/gamecards/${appid}`, border ? {"border": 1} : {}, true);
    }

    static stats(path, appid) {
        return SteamCommunityApi.getPage(`${path}/stats/${appid}`, {}, true);
    }

    static async getInventory(contextId) {
        const login = LocalStorage.get("login");
        if (!login.steamId) {
            console.warn("Must be signed in to access Inventory");
            return null;
        }

        const params = {"l": "english", "count": 2000};
        let data = null;
        let result, lastAssetid;

        do {
            const thisParams = Object.assign(params, lastAssetid ? {"start_assetid": lastAssetid} : null);
            result = await SteamCommunityApi.getEndpoint(`/inventory/${login.steamId}/753/${contextId}`, thisParams, res => {
                if (res.status === 403) {
                    throw new Errors.LoginError("community");
                }
            });
            if (result && result.success) {
                if (!data) { data = {"assets": [], "descriptions": []}; }
                if (result.assets) { data.assets = data.assets.concat(result.assets); }
                if (result.descriptions) { data.descriptions = data.descriptions.concat(result.descriptions); }
                lastAssetid = result.last_assetid;
            }
        } while (result.more_items);

        if (!data) {
            throw new Error(`Could not retrieve Inventory 753/${contextId}`);
        }
        return data;
    }

    /*
     * Inventory functions, must be signed in to function correctly
     */
    static async coupons() { // context#3
        const data = await SteamCommunityApi.getInventory(3);
        if (!data) { return null; }

        const coupons = new Map();

        for (const description of data.descriptions) {
            if (!description.type || description.type !== "Coupon") { continue; }
            if (!description.actions) { continue; }

            const coupon = {
                "image_url": description.icon_url,
                "title": description.name,
                "discount": description.name.match(/([1-9][0-9])%/)[1],
                "id": `${description.classid}_${description.instanceid}`
            };
            description.descriptions.forEach((desc, i) => {
                const value = desc.value;
                if (value.startsWith("Can't be applied with other discounts.")) {
                    Object.assign(coupon, {
                        "discount_note": value,
                        "discount_note_id": i,
                        "discount_doesnt_stack": true,
                    });
                } else if (value.startsWith("(Valid")) {
                    Object.assign(coupon, {
                        "valid_id": i,
                        "valid": value,
                    });
                }
            });

            for (const action of description.actions) {
                const match = action.link.match(/[1-9][0-9]*(?:,[1-9][0-9]*)*/);
                if (!match) {
                    console.warn("Couldn't find packageid(s) for link %s", action.link);
                    continue;
                }

                for (let packageid of match[0].split(",")) {
                    packageid = Number(packageid);
                    if (!coupons.has(packageid) || coupons.get(packageid).discount < coupon.discount) {
                        coupons.set(packageid, coupon);
                    }
                }
            }
        }

        const packages = await IndexedDB.get("packages", Array.from(coupons.keys()));

        for (const [subid, coupon] of coupons.entries()) {
            const details = packages[subid];
            if (details) {
                coupon.appids = details;
            } else {
                coupon.appids = [];
            }
        }

        return IndexedDB.put("coupons", coupons);
    }

    static getCoupon(appid) { return IndexedDB.getFromIndex("coupons", "appid", appid); }
    static hasCoupon(appid) { return IndexedDB.indexContainsKey("coupons", "appid", appid); }

    static async giftsAndPasses() { // context#1, gifts and guest passes
        const data = await SteamCommunityApi.getInventory(1);
        if (!data) { return null; }

        const gifts = [];
        const passes = [];

        let isPackage = false;

        for (const description of data.descriptions) {

            const desc = description.descriptions?.find(d => d.type === "html");
            if (desc) {
                const appids = GameId.getAppids(desc.value);
                if (appids.length > 0) {

                    // Gift package with multiple apps
                    isPackage = true;

                    for (const appid of appids) {
                        if (description.type === "Gift") {
                            gifts.push(appid);
                        } else {
                            passes.push(appid);
                        }
                    }
                }
            }

            // Single app
            if (!isPackage && description.actions) {
                const appid = GameId.getAppid(description.actions[0].link);
                if (appid) {
                    if (description.type === "Gift") {
                        gifts.push(appid);
                    } else {
                        passes.push(appid);
                    }
                }
            }
        }

        return IndexedDB.put("giftsAndPasses", {gifts, passes});
    }

    static hasGiftsAndPasses(appid) {
        return IndexedDB.getFromIndex("giftsAndPasses", "appid", appid, {"all": true, "asKey": true});
    }

    // Only used for market highlighting
    static async items() { // context#6, community items
        const data = await SteamCommunityApi.getInventory(6);
        if (!data) { return null; }

        return IndexedDB.put("items", data.descriptions.map(item => item.market_hash_name));
    }

    static hasItem(hashes) { return IndexedDB.contains("items", hashes); }

    static async fetchWorkshopFileSize({"key": id}) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(await SteamCommunityApi.getPage("/sharedfiles/filedetails/", {id}), "text/html");

        const details = doc.querySelector(".detailsStatRight")?.textContent;
        if (!details || !details.includes("MB")) {
            throw new Error(`Couldn't find details block for item id "${id}"`);
        }

        const size = parseFloat(details.replace(/,/g, ""));
        if (Number.isNaN(size)) {
            throw new Error(`Invalid file size for item id "${id}"`);
        }

        return IndexedDB.put("workshopFileSizes", new Map([[id, size * 1000]]));
    }

    static getWorkshopFileSize(id, preventFetch) {
        return IndexedDB.get("workshopFileSizes", id, {preventFetch});
    }

    static async fetchReviews({"key": steamId, "params": {pages}}) {
        const parser = new DOMParser();
        const reviews = [];
        let defaultOrder = 0;

        for (let p = 1; p <= pages; p++) {
            const doc = parser.parseFromString(await SteamCommunityApi.getPage(`${steamId}/recommended`, {p}), "text/html");

            for (const node of doc.querySelectorAll(".review_box")) {
                defaultOrder++;

                const rating = node.querySelector("[src*=thumbsUp]") ? 1 : 0;

                const [helpful = 0, funny = 0] = Array.from(node.querySelector(".header").childNodes)
                    .filter(node => node.nodeType === 3)
                    .map(node => {
                        const text = node.textContent.match(/(?:\d+,)?\d+/);
                        return text ? Number(text[0].replace(/,/g, "")) : 0;
                    });

                const length = node.querySelector(".content").textContent.trim().length;

                // There're only two kinds of visibility, Public: 0; Friends-only: 1
                const visibilityNode = node.querySelector("input[id^=ReviewVisibility]");
                const visibility = visibilityNode ? Number(visibilityNode.value) : 0;

                const reviewId = visibilityNode
                    // Only exists when the requested profile is yours
                    ? visibilityNode.id.replace("ReviewVisibility", "")
                    // Otherwise you have buttons to vote for and award the review
                    : node.querySelector(".control_block > a").id.replace("RecommendationVoteUpBtn", "");

                // Total playtime comes first
                const playtimeText = node.querySelector(".hours").textContent.match(/(?:\d+,)?\d+\.\d+/);
                const playtime = playtimeText ? parseFloat(playtimeText[0].replace(/,/g, "")) : 0.0;

                // Count total awards received
                const awards = Array.from(node.querySelectorAll(".review_award"))
                    .reduce((acc, node) => {
                        const count = node.classList.contains("more_btn")
                            ? 0
                            : Number(node.querySelector(".review_award_count").textContent.trim());
                        return acc + count;
                    }, 0);

                const devResponseNode = node.nextElementSibling.classList.contains("review_developer_response_container")
                    ? DOMPurify.sanitize(node.nextElementSibling.outerHTML)
                    : "";

                reviews.push({
                    "default": defaultOrder,
                    rating,
                    helpful,
                    funny,
                    length,
                    visibility,
                    playtime,
                    awards,
                    "node": DOMPurify.sanitize(node.outerHTML) + devResponseNode,
                    "id": reviewId
                });
            }
        }

        return IndexedDB.put("reviews", {[steamId]: reviews});
    }

    static getReviews(steamId, pages) {
        return IndexedDB.get("reviews", steamId, {"params": {pages}});
    }

    /*
     * Invoked when the content script thinks the user is logged in
     * If we don't know the user's steamId, fetch their community profile
     */
    static async login(profilePath) {
        const self = SteamCommunityApi;

        if (!profilePath) {
            self.logout();
            throw new Error("Login endpoint needs a valid profile path");
        }
        if (!profilePath.startsWith("/id/") && !profilePath.startsWith("/profiles/")) {
            self.logout();
            throw new Error(`Could not interpret ${profilePath} as a valid profile path`);
        }

        const login = LocalStorage.get("login");
        if (login.profilePath === profilePath) { return login; }

        const html = await self.getPage(profilePath, {}, true);
        const profileData = HTMLParser.getVariableFromText(html, "g_rgProfileData", "object");
        const steamId = profileData.steamid;

        if (!steamId) { // this should never happen
            throw new Error("Failed to retrieve steamID from profile");
        }

        self.logout(true);

        const value = {steamId, profilePath};
        LocalStorage.set("login", value);

        return value;
    }

    static logout(newLogout = LocalStorage.has("login")) {
        if (newLogout) {
            LocalStorage.remove("login");
            LocalStorage.remove("storeCountry");
            CacheStorage.remove("currency");
        }
    }

    // TODO This and (at least) the login calls don't seem appropriate in this class
    static storeCountry(newCountry) {
        if (newCountry) {
            LocalStorage.set("storeCountry", newCountry);
            return null;
        } else {
            return LocalStorage.get("storeCountry");
        }
    }

    static getProfile(steamId) {
        return IndexedDB.get("profiles", steamId, {"params": {"profile": steamId}});
    }

    static clearOwn(steamId) {
        return IndexedDB.delete("profiles", steamId);
    }

    static getPage(endpoint, query, crossDomain) {
        return super.getPage(endpoint, query, res => {
            if (new URL(res.url).pathname === "/login/home/") {
                throw new Errors.LoginError("community");
            }
        }, {}, crossDomain);
    }
}
SteamCommunityApi.origin = "https://steamcommunity.com/";
SteamCommunityApi.params = {"credentials": "include"};

export {SteamCommunityApi};
