import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FUsefulLinks extends Feature {

    apply() {

        const blocks = document.querySelectorAll(".account_setting_block");

        // View total spent
        HTML.beforeEnd(
            blocks[0].querySelector(".account_setting_sub_block:nth-child(2)"),
            `<div>
                <a class="account_manage_link" href="https://help.steampowered.com/accountdata/AccountSpend">${Localization.str.external_funds}</a>
            </div>`
        );

        // View shopping cart history
        HTML.afterEnd(
            blocks[0].querySelector(".account_setting_sub_block:nth-child(2) > div"),
            `<div>
                <a class="account_manage_link" href="https://help.steampowered.com/accountdata/ShoppingCartHistory">${Localization.str.shopping_cart_history}</a>
            </div>`
        );

        // Manage Web API key
        HTML.beforeEnd(
            blocks[2].querySelector(".account_setting_sub_block:nth-child(2)"),
            `<div>
                <a class="account_manage_link" href="https://steamcommunity.com/dev/apikey">${Localization.str.manage_webapi_key}</a>
            </div>`
        );

        // Steam Cloud section
        HTML.afterEnd(
            blocks[3],
            `<div class="account_header_line noicon">
                <div>${Localization.str.steam_cloud_header}</div>
            </div>
            <div class="account_setting_block_short">
                <div class="account_setting_sub_block">
                    <div>
                        <a class="account_manage_link" href="https://store.steampowered.com/account/remotestorage" style="margin-top: 8px;">${Localization.str.steam_cloud_saves}</a>
                    </div>
                </div>
                <div style="clear: both;"></div>
            </div>`
        );
    }
}
