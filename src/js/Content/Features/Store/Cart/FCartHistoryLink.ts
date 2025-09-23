import {L} from "@Core/Localization/Localization";
import {__shoppingCartHistory} from "@Strings/_strings";
import type CCart from "@Content/Features/Store/Cart/CCart";
import HTML from "@Core/Html/Html";
import Feature from "@Content/Modules/Context/Feature";

export default class FCartHistoryLink extends Feature<CCart> {

    override async apply(): Promise<void> {

        const root = document.querySelector('[data-featuretarget="react-root"]');
        if (!root) { return; }

        new MutationObserver((_, observer) => {
            const anchor = root.querySelector<HTMLElement>("._3TtUDn-J9j6rkwHqjT-i4Y")

            if (anchor) {
                HTML.beforeEnd(anchor,
                    `&nbsp;>&nbsp;<a href="https://help.steampowered.com/accountdata/ShoppingCartHistory" target="_blank">
                    ${L(__shoppingCartHistory)}
                </a>`);

                observer.disconnect();
            }
        }).observe(root, {"childList": true, "subtree": true});
    }
}
