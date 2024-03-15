import {LocalStorage, Localization} from "../../../../modulesCore";
import {CallbackFeature, RequestData} from "../../../modulesContent";

export default class FWishlistDemoLink extends CallbackFeature {

    async checkPrerequisites() {

        this._info = [];

        const now = Date.now();
        let appids = this.context.wishlistData.map(({appid}) => Number(appid));

        let cache = LocalStorage.get("wl_demo_appids");
        if (cache.length > 0) {
            appids = new Set(appids);
            cache = cache.filter(({appid, cached}) => {
                const _appid = Number(appid);
                if (!appids.has(_appid) || (cached.timestamp < now)) {
                    return false;
                }
                if (cached.info?.demo_appid) {
                    this._info.push(cached.info);
                }
                appids.delete(_appid);
                return true;
            });
            appids = Array.from(appids);
        }

        // Split params into chunks as Steam may throw `HTTP 414 Request-URI Too Large`
        const chunkSize = 400;

        for (let i = 0; i < appids.length; i += chunkSize) {
            const chunk = appids.slice(i, i + chunkSize);
            const params = chunk.map(appid => `appids[]=${appid}`).join("&");

            const data = await RequestData.getJson(`https://store.steampowered.com/saleaction/ajaxgetdemoevents?${params}`).catch(err => console.error(err));
            if (!data || !data.success) { continue; }

            // Cache appids for 24 hrs if fetch is successful
            chunk.forEach(appid => {

                // `data.info` will be undefined if there're no demos for all given appids
                const info = data.info?.find(val => Number(val.appid) === appid);
                cache.push({
                    appid,
                    cached: {
                        timestamp: now + (24 * 60 * 60 * 1000),
                        info,
                    }
                });

                if (info?.demo_appid) {
                    this._info.push(info);
                }
            });
        }

        LocalStorage.set("wl_demo_appids", cache);
        return this._info.length > 0;
    }

    callback(nodes) {

        for (const node of nodes) {

            const rowAppid = Number(node.dataset.appId);
            const demoAppid = this._info.find(({appid}) => appid === rowAppid)?.demo_appid;
            if (typeof demoAppid === "undefined") { continue; }

            const link = document.createElement("a");
            link.href = `steam://install/${demoAppid}`;
            link.textContent = Localization.str.download_demo;
            link.classList.add("earlyaccess");
            node.querySelector(".platform_icons").prepend(link);
        }
    }
}
