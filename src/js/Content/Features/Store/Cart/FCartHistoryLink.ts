import {L} from "@Core/Localization/Localization";
import {__shoppingCartHistory} from "@Strings/_strings";
import HTML from "@Core/Html/Html";
import Feature from "@Content/Modules/Context/Feature";
import type Context from "@Content/Modules/Context/Context";
import dynamicNode from "@Content/Modules/DOM/DynamicNode";
import SelectorMap from "@Content/SelectorMap";

export default class FCartHistoryLink extends Feature<Context> {

    public override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        const anchor = await dynamicNode({
            selector: () => document.querySelector<HTMLElement>(SelectorMap.store.cart.yourShoppingCartBreadcrumb)
        });

        HTML.beforeEnd(anchor,
            `&nbsp;>&nbsp;<a href="https://help.steampowered.com/accountdata/ShoppingCartHistory" target="_blank">
                ${L(__shoppingCartHistory)}
            </a>`
        );

        return null;
    }
}
