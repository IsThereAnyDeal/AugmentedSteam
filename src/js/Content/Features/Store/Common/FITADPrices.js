import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, Prices} from "../../../modulesContent";

export default class FITADPrices extends Feature {
    checkPrerequisites() {
        return SyncedStorage.get("showlowestprice");
    }

    apply() {
        const prices = new Prices();

        prices.subids = this.context.getAllSubids();

        prices.bundleids = [];
        for (const node of document.querySelectorAll("[data-ds-bundleid]")) {
            prices.bundleids.push(node.dataset.dsBundleid);
        }

        prices.priceCallback = function(type, id, contentNode) {
            let node;
            let placement = "beforebegin";
            if (type === "sub") {
                node = document.querySelector(`input[name=subid][value="${id}"]`).closest(".game_area_purchase_game");
            } else if (type === "bundle") {
                node = document.querySelector(`.game_area_purchase_game_wrapper[data-ds-bundleid="${id}"]`);
                if (node) {
                    placement = "afterbegin";

                    // Move any "Complete your Collection!" banner out of the way
                    const banner = node.querySelector(".ds_completetheset");
                    const newParent = node.querySelector(".game_area_purchase_game");
                    if (banner && newParent) {
                        newParent.appendChild(banner);
                    }
                } else {
                    node = document.querySelector(`.game_area_purchase_game[data-ds-bundleid="${id}"]`);
                }
            }

            node.insertAdjacentElement(placement, contentNode);
        };

        prices.bundleCallback = function(html) {

            HTML.afterEnd("#game_area_purchase",
                `<h2 class="gradientbg es_external_icon">${Localization.str.bundle.header}</h2>
                ${html}`);
        };

        prices.load();
    }
}
