import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
//import Settings from "@Options/Data/Settings";
import {L} from "@Core/Localization/Localization";
import {__downloadDemo} from "@Strings/_strings";
import LocalStorage from "@Core/Storage/LocalStorage";
import RequestData from "@Content/Modules/RequestData";

export default class FWishlistDemoLink extends Feature<CWishlist> {

    private demoMap: Map<number, number> = new Map();

    override async checkPrerequisites(): Promise<boolean> {

        const now = Date.now();
        let appids: number[] = this.context.wishlistData.map(({appid}) => Number(appid));

        let cache = await LocalStorage.get("wl_demo_appids") ?? [];
        if (cache.length > 0) {
            const _appids = new Set(appids);
            cache = cache.filter(({appid, demoAppid, expiry}) => {
                if (!_appids.has(appid) || (expiry < now)) {
                    return false;
                }
                if (demoAppid) {
                    this.demoMap.set(appid, demoAppid);
                }
                _appids.delete(appid);
                return true;
            });
            appids = Array.from(_appids);
        }

        // Split params into chunks as Steam may throw `HTTP 414 Request-URI Too Large`
        const chunkSize = 400;

        for (let i = 0; i < appids.length; i += chunkSize) {
            const chunk = appids.slice(i, i + chunkSize);
            const params = chunk.map(appid => `appids[]=${appid}`).join("&");

            const data = await RequestData.getJson<{
                success: number,
                info?: {
                    appid: number,
                    demo_appid: number, // 0 if no demo
                    demo_package_id: number, // Not sure what this is for
                }[],
            }>(`https://store.steampowered.com/saleaction/ajaxgetdemoevents?${params}`).catch(err => console.error(err));
            if (!data || !data.success) { continue; }

            // Cache appids for 24 hrs if fetch is successful
            chunk.forEach(appid => {

                // `data.info` will be undefined if there're no demos for all given appids
                const demoAppid = data.info?.find(val => Number(val.appid) === appid)?.demo_appid;
                cache.push({
                    appid,
                    demoAppid,
                    expiry: now + (24 * 60 * 60 * 1000),
                });

                if (demoAppid) {
                    this.demoMap.set(appid, demoAppid);
                }
            });
        }

        await LocalStorage.set("wl_demo_appids", cache);
        return this.demoMap.size > 0;
    }

    override apply(): void {
        this.context.onWishlistUpdate.subscribe(e => {
            const nodes = e.data;

            for (const node of nodes) {

                const appid = Number(node.dataset.appId);
                const demoAppid = this.demoMap.get(appid);
                if (demoAppid === undefined) { continue; }

                const link = document.createElement("a");
                link.href = `steam://install/${demoAppid}`;
                link.textContent = L(__downloadDemo);
                link.classList.add("earlyaccess");
                node.querySelector(".platform_icons")!.prepend(link);
            }
        });
    }
}
