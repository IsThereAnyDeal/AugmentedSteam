import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, RequestData} from "../../../modulesContent";

export default class FSteamDeckCompatibility extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showdeckcompat");
    }

    async apply() {

        const compatNode = document.querySelector("[data-featuretarget=deck-verified-results]");
        if (compatNode) {
            // Move the section to a more prominent position
            document.querySelector("#category_block").insertAdjacentElement("afterbegin", compatNode);
            return;
        }

        // Compat info is not shown in regions where Valve doesn't sell the Steam Deck, or if the game is untested (usually means the status is unknown)
        const data = await RequestData.getJson(`https://store.steampowered.com/saleaction/ajaxgetdeckappcompatibilityreport?nAppID=${this.context.appid}`);
        if (!data || !data.success) { return; }

        let status;
        const code = data.results.resolved_category;
        switch (code) {
            case 0: // unknown, treating as unsupported since icons are the same
            case 1:
                status = "unsupported";
                break;
            case 2:
                status = "playable";
                break;
            case 3:
                status = "verified";
                break;
            default:
                console.error("Unknown Steam Deck compatibility status code: %s", code);
                return;
        }

        const iconUrl = ExtensionResources.getURL(`img/deck_${status}.svg`);

        HTML.afterBegin("#category_block",
            `<div class="as_deckverified_BannerContainer">
                <div class="as_deckverified_BannerHeader">${Localization.str.deck_compat.header}</div>
                <div class="as_deckverified_BannerContentDesktop">
                    <img class="as_svg_SteamDeckCompatIcon" src="${iconUrl}">
                    <span class="as_deckverified_CompatibilityDetailRatingDescription">${Localization.str.deck_compat[status]}</span>
                </div>
            </div>`);
    }
}
