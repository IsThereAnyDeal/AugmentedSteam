import {LocalStorage} from "../../Core/Storage/LocalStorage";
import {Errors} from "../../Core/Errors/Errors";
import {GameId} from "../../Core/GameId";
import {HTMLParser} from "../../Core/Html/HtmlParser";
import {Api} from "./Api";
import {CacheStorage} from "./CacheStorage";
import {IndexedDB} from "./IndexedDB";

class SteamCommunityApi extends Api {

    /*
     * static origin = "https://steamcommunity.com/";
     * static params = { 'credentials': 'include', };
     */

    static cards(appid, border) {
        return SteamCommunityApi.getPage(`/my/gamecards/${appid}`, (border ? {"border": 1} : {}));
    }

    static stats(path, appid) {
        return SteamCommunityApi.getPage(`${path}/stats/${appid}`);
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
        const coupons = new Map();
        const data = await SteamCommunityApi.getInventory(3);
        if (!data) { return null; }

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
        const gifts = [];
        const passes = [];

        let isPackage;

        let data = await SteamCommunityApi.getInventory(1);
        if (!data) { return null; }

        function addGiftsAndPasses(description) {
            const appids = GameId.getAppids(description.value);

            // Gift package with multiple apps
            isPackage = true;

            for (const appid of appids) {
                if (!appid) { continue; }
                if (description.type === "Gift") {
                    gifts.push(appid);
                } else {
                    passes.push(appid);
                }
            }
        }

        for (const description of data.descriptions) {
            isPackage = false;
            if (description.descriptions) {
                for (const desc of description.descriptions) {
                    if (desc.type !== "html") { continue; }

                    addGiftsAndPasses(desc);

                    break;
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

        data = {
            "gifts": gifts,
            "passes": passes,
        };

        return IndexedDB.put("giftsAndPasses", data);
    }

    static hasGiftsAndPasses(appid) {
        return IndexedDB.getFromIndex("giftsAndPasses", "appid", appid, {"all": true, "asKey": true});
    }

    static async items() { // context#6, community items
        // only used for market highlighting
        const data = await SteamCommunityApi.getInventory(6);
        if (data) {
            return IndexedDB.put("items", data.descriptions.map(item => item.market_hash_name));
        }
        return null;
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

    static _getReviewId(node) {
        const input = node.querySelector("input");

        /*
         * Only exists when the requested profile is yours
         * (these are the input fields where you can change visibility and language of the review)
         */
        if (input) {
            return Number(input.id.replace("ReviewVisibility", ""));
        }

        // Otherwise you have buttons to vote for the review (Was it helpful or not, was it funny?)
        return Number(node.querySelector(".control_block > a").id.replace("RecommendationVoteUpBtn", ""));
    }

    static async fetchReviews({"key": steamId, "params": {reviewCount}}) {
        const parser = new DOMParser();
        const pageCount = 10;
        const reviews = [];

        for (let p = 1; p <= Math.ceil(reviewCount / pageCount); p++) {
            const doc = parser.parseFromString(await SteamCommunityApi.getPage(`${steamId}/recommended`, {p}), "text/html");

            for (const node of doc.querySelectorAll(".review_box")) {
                const headerText = node.querySelector(".header").innerHTML.split("<br>");
                const playtimeText = node.querySelector(".hours").textContent.split("(")[0].match(/(\d+,)?\d+\.\d+/);
                const visibilityNode = node.querySelector(".dselect_container:nth-child(2) .trigger");

                const id = SteamCommunityApi._getReviewId(node);
                const rating = node.querySelector("[src*=thumbsUp]") ? 1 : 0;
                const helpful = headerText[0] && headerText[0].match(/\d+/g) ? parseInt(headerText[0].match(/\d+/g).join("")) : 0;
                const funny = headerText[1] && headerText[1].match(/\d+/g) ? parseInt(headerText[1].match(/\d+/g).join("")) : 0;
                const length = node.querySelector(".content").textContent.trim().length;
                const visibility = visibilityNode ? visibilityNode.textContent : "Public";
                const playtime = playtimeText ? parseFloat(playtimeText[0].split(",").join("")) : 0.0;

                reviews.push({
                    rating,
                    helpful,
                    funny,
                    length,
                    visibility,
                    playtime,
                    "node": DOMPurify.sanitize(node.outerHTML),
                    id
                });
            }
        }

        return IndexedDB.put("reviews", {[steamId]: reviews});
    }

    static async updateReviewNode(steamId, html, reviewCount) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const node = doc.querySelector(".review_box");
        const id = SteamCommunityApi._getReviewId(node);

        if (!await IndexedDB.contains("reviews", steamId, {"preventFetch": true})) { return null; }

        const reviews = await IndexedDB.get("reviews", steamId, {"params": reviewCount});

        for (const review of reviews) {
            if (review.id === id) {
                review.node = DOMPurify.sanitize(node.outerHTML);
                break;
            }
        }

        // Todo updates expiry even though there is no new fetched data
        return IndexedDB.put("reviews", {[steamId]: reviews});
    }

    static getReviews(steamId, reviewCount) {
        return IndexedDB.get("reviews", steamId, {"params": {reviewCount}});
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

        const html = await self.getPage(profilePath);
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

    static async getPage(endpoint, query) {
        const response = await this._fetchWithDefaults(endpoint, query, {"method": "GET"});
        if (new URL(response.url).pathname === "/login/home/") {
            throw new Errors.LoginError("community");
        }
        return response.text();
    }
}
SteamCommunityApi.origin = "https://steamcommunity.com/";
SteamCommunityApi.params = {"credentials": "include"};

export {SteamCommunityApi};
