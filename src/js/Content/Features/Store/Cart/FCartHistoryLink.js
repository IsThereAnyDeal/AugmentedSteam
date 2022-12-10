import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FCartHistoryLink extends Feature {

    apply() {

        HTML.afterEnd("h2.pageheader",
            `<a href="https://help.steampowered.com/accountdata/ShoppingCartHistory" target="_blank">
                ${Localization.str.shopping_cart_history}
            </a>`);
    }
}
