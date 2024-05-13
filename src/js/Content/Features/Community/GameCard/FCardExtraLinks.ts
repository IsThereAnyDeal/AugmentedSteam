import {__viewFoilBadge, __viewNormalBadge, __visitStore, __visitTradeForum} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CGameCard from "@Content/Features/Community/GameCard/CGameCard";
import HTML from "@Core/Html/Html";

export default class FCardExtraLinks extends Feature<CGameCard> {

    override apply(): void {

        const url = new URL(window.location.href);
        let text;
        if (this.context.isFoil) {
            url.searchParams.delete("border");
            text = L(__viewNormalBadge);
        } else {
            url.searchParams.set("border", "1");
            text = L(__viewFoilBadge);
        }

        let html = `<a class="btn_grey_grey btn_small_thin" href="${url}"><span>${text}</span></a>`;

        const appid = this.context.appid;
        if (!this.context.saleAppids.includes(appid)) {
            html += `<div class="es_gamecards_links">
                <a class="btn_grey_grey btn_medium" href="//store.steampowered.com/app/${appid}/">
                    <span>${L(__visitStore)}</span>
                </a>
                <a class="btn_grey_grey btn_medium" href="//steamcommunity.com/app/${appid}/tradingforum/">
                    <span>${L(__visitTradeForum)}</span>
                </a>
            </div>`;
        }

        const node = document.querySelector(".badge_detail_tasks > .gamecards_inventorylink");
        if (node) {
            HTML.beforeEnd(node, html);
        } else {
            HTML.afterBegin(".badge_detail_tasks", `<div class="gamecards_inventorylink">${html}</div>`);
        }
    }
}
