import {Localization} from "../../../../modulesCore";
import {CallbackFeature, RequestData} from "../../../modulesContent";

export default class FWishlistDemoLink extends CallbackFeature {

    async checkPrerequisites() {

        this._info = [];

        const appids = this.context.wishlistData.map(({appid}) => `appids[]=${appid}`);

        // https://stackoverflow.com/questions/8495687/split-array-into-chunks
        const chunkSize = 400; // Split params into chunks as Steam may throw `HTTP 414 Request-URI Too Large`

        for (let i = 0; i < appids.length; i += chunkSize) {
            const params = appids.slice(i, i + chunkSize).join("&");

            const data = await RequestData.getJson(`https://store.steampowered.com/saleaction/ajaxgetdemoevents?${params}`).catch(err => console.error(err));
            if (!data || !data.success || !data.info) { continue; }

            this._info = this._info.concat(data.info.filter(val => Boolean(val.demo_appid)));
        }

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
