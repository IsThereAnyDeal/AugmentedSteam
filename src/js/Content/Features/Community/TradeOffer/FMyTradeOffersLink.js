import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization} from "../../../../modulesCore";

export default class FMyTradeOffersLink extends Feature {

    checkPrerequisites() {
        this._linksNode = document.querySelector(".error_page_links");
        return this._linksNode !== null;
    }

    apply() {

        HTML.beforeEnd(
            this._linksNode,
            `<div class="black_square_btn" id="back_to_tradeoffers_btn"> <a href="https://steamcommunity.com/my/tradeoffers"><div class="cap left"></div><div class="cap right"></div>${Localization.str.tradeoffer.back}</a></div>`,
        );
    }
}
