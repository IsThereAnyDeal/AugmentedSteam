import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FUsefulLinks extends Feature {

    apply() {

        // View total spent
        HTML.beforeEnd(
            document.querySelector(".account_setting_block .account_setting_sub_block:nth-child(2)"),
            `<div>
                <a class="account_manage_link" href="https://help.steampowered.com/accountdata/AccountSpend">${Localization.str.external_funds}</a>
            </div>`
        );
    }
}
