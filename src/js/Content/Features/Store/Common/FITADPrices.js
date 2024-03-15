import {SyncedStorage} from "../../../../modulesCore";
import BundleOverview from "../../../Modules/Prices/BundleOverview.svelte";
import PriceOverview from "../../../Modules/Prices/PriceOverview.svelte";
import {Feature, Prices} from "../../../modulesContent";

export default class FITADPrices extends Feature {
    checkPrerequisites() {
        return SyncedStorage.get("showlowestprice");
    }

    _insertPrices(type, id, data) {
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

        let target = node.parentElement;
        let anchor = node;

        if (placement === "afterbegin") {
            target = node;
            anchor = node.firstElementChild ?? null;
        }

        new PriceOverview({
            target,
            anchor,
            props: {data}
        });
    }

    _insertBundles(data) {
        const target = document.querySelector("#game_area_purchase");

        if (target) {
            const anchor = target.nextElementSibling;

            if (anchor) {
                new BundleOverview({
                    target: anchor.parentElement,
                    anchor,
                    props: {data}
                });
            }
        }
    }

    apply() {
        const prices = new Prices();

        let subs = this.context.getAllSubids().map(Number);
        let bundles = [];
        for (const node of document.querySelectorAll("[data-ds-bundleid]")) {
            bundles.push(Number(node.dataset.dsBundleid));
        }

        if (subs.length === 0 && bundles.length === 0) {
            return;
        }

        prices
            .load({
                subs: subs,
                bundles: bundles
            })
            .then(({
                prices,
                bundles,
            }) => {
                for (let {type, id, data} of prices) {
                    this._insertPrices(type, id, data);
                }
                this._insertBundles(bundles);
            });
    }
}
