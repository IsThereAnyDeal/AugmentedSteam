import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FCardExtraLinks extends Feature {

    apply() {

        const url = new URL(window.location.href);
        let text;
        if (this.context.isFoil) {
            url.searchParams.delete("border");
            text = Localization.str.view_normal_badge;
        } else {
            url.searchParams.set("border", "1");
            text = Localization.str.view_foil_badge;
        }

        let html = `<a class="btn_grey_grey btn_small_thin" href="${url}"><span>${text}</span></a>`;

        const appid = this.context.appid;
        if (!this.context.saleAppids.includes(appid)) {
            html += `<div class="es_gamecards_links">
                <a class="btn_grey_grey btn_medium" href="//store.steampowered.com/app/${appid}/">
                    <span>${Localization.str.visit_store}</span>
                </a>
                <a class="btn_grey_grey btn_medium" href="//steamcommunity.com/app/${appid}/tradingforum/">
                    <span>${Localization.str.visit_trade_forum}</span>
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
