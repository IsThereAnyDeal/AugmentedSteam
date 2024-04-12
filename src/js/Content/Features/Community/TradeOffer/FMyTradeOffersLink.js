import {__tradeoffer_back} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FMyTradeOffersLink extends Feature {

    checkPrerequisites() {
        this._linksNode = document.querySelector(".error_page_links");
        return this._linksNode !== null;
    }

    apply() {

        HTML.beforeEnd(
            this._linksNode,
            `<div class="black_square_btn" id="back_to_tradeoffers_btn"> <a href="https://steamcommunity.com/my/tradeoffers"><div class="cap left"></div><div class="cap right"></div>${L(__tradeoffer_back)}</a></div>`,
        );
    }
}
