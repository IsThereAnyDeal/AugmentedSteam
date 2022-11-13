import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, RequestData} from "../../../modulesContent";

export default class FSteamDeckCompatibility extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showdeckcompat");
    }

    async apply() {

        const compatNode = document.querySelector("[data-featuretarget=deck-verified-results]");
        if (compatNode) {
            // Move the section to the features list
            document.querySelector("#category_block").insertAdjacentElement("afterbegin", compatNode);
            return;
        }

        /**
         * This section is hidden in regions where Valve doesn't sell the Steam Deck,
         * or if the game is untested/under review (usually means the status is unknown).
         */
        const data = await RequestData.getJson(`https://store.steampowered.com/saleaction/ajaxgetdeckappcompatibilityreport?nAppID=${this.context.appid}`);
        if (!data || !data.success) { return; }

        let status, icon;
        const code = data.results.resolved_category;
        switch (code) {
            case 0:
                status = "unknown";
                icon = "1a3a76c9e8dacf756b822247a23bef435768a5ff.png";
                break;
            case 1:
                status = "unsupported";
                icon = "dd56b9d37f5b5bf4da236b9bd3d62e3d120d7df5.png";
                break;
            case 2:
                status = "playable";
                icon = "16e802051c2a3b99c7f1720b7de7fad6e540e02a.png";
                break;
            case 3:
                status = "verified";
                icon = "82a3cff3038fbb4c36fabb5dd79540b23fa9a4d4.png";
                break;
            default:
                console.error("Unknown Steam Deck compatibility status code: %s", code);
                return;
        }

        HTML.afterBegin("#category_block",
            `<div class="as_deckverified_BannerContainer">
                <div class="as_deckverified_BannerHeader">${Localization.str.deck_compat.header}</div>
                <div class="as_deckverified_BannerContent">
                    <img class="as_svg_SteamDeckCompatIcon" src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/39049601/${icon}">
                    <span class="as_deckverified_CompatibilityDetailRatingDescription">${Localization.str.deck_compat[status]}</span>
                </div>
            </div>`);
    }
}
