import {L} from "@Core/Localization/Localization";
import {__shoppingCartHistory} from "@Strings/_strings";
import type CCart from "@Content/Features/Store/Cart/CCart";
import HTML from "@Core/Html/Html";
import Feature from "@Content/Modules/Context/Feature";

export default class FCartHistoryLink extends Feature<CCart> {

    override async apply(): Promise<void> {

        const root = document.querySelector('[data-featuretarget="react-root"]');
        if (!root) { return; }

        const anchor = await new Promise<HTMLElement|null>(resolve => {
            new MutationObserver((_, observer) => {
                observer.disconnect();
                resolve(
                    root.querySelector<HTMLElement>(":scope > div:first-child > div:last-child > div:last-child")
                );
            }).observe(root, {"childList": true, "subtree": true});
        });

        if (anchor) {
            HTML.beforeBegin(anchor,
                `<a href="https://help.steampowered.com/accountdata/ShoppingCartHistory" target="_blank">
                    ${L(__shoppingCartHistory)}
                </a>`);
        }
    }
}
