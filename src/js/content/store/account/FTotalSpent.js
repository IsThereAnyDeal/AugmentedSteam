import { ASFeature } from "../../ASFeature.js";
import { HTML } from "../../../core.js";
import { Localization } from "../../../language.js";

export class FTotalSpent extends ASFeature {

    _links;

    checkPrerequisites() {
        this._links = document.querySelectorAll(".account_setting_block:nth-child(2) .account_setting_sub_block:nth-child(2) .account_manage_link");
        return this._links && this._links.length > 0;
    }

    apply() {
        let lastLink = this._links[this._links.length - 1];
        HTML.afterEnd(lastLink.parentNode,
            `<div><a class="account_manage_link" href="https://help.steampowered.com/accountdata/AccountSpend">${Localization.str.external_funds}</a></div>`);
    }
}
