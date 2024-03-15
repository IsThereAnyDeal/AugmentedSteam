import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FCartHistoryLink extends Feature {

    async apply() {

        const root = document.querySelector('[data-featuretarget="react-root"]');
        if (!root) { return; }

        const anchor = await new Promise(resolve => {
            new MutationObserver((_, observer) => {
                observer.disconnect();
                resolve(
                    root.querySelector(":scope > div:first-child > div:last-child > div:last-child")
                );
            }).observe(root, {"childList": true, "subtree": true});
        });

        HTML.beforeBegin(anchor,
            `<a href="https://help.steampowered.com/accountdata/ShoppingCartHistory" target="_blank">
                ${Localization.str.shopping_cart_history}
            </a>`);
    }
}
