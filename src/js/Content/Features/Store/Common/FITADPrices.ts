import BundleOverview from "../../../Modules/Prices/BundleOverview.svelte";
import PriceOverview from "../../../Modules/Prices/PriceOverview.svelte";
import type CBundle from "@Content/Features/Store/Bundle/CBundle";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import Prices from "@Content/Modules/Prices/Prices";
import type {TBundle, TPriceOverview} from "@Background/Modules/AugmentedSteam/_types";
import type CSub from "@Content/Features/Store/Sub/CSub";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FITADPrices extends Feature<CApp|CSub|CBundle> {

    override checkPrerequisites(): boolean {
        return Settings.showlowestprice;
    }

    private insertPrices(type: "app"|"sub"|"bundle", id: number, data: TPriceOverview) {
        let anchor: HTMLElement|null = null;

        if (type === "sub") {
            const inputEl = document.querySelector(`input[name=subid][value="${id}"]`);
            if (inputEl) {
                anchor = inputEl.closest(".game_area_purchase_game_wrapper") // Subs on app pages
                    || inputEl.closest(".game_area_purchase_game"); // Subs on sub pages
            }
        } else if (type === "bundle") {
            anchor = document.querySelector(`.game_area_purchase_game_wrapper[data-ds-bundleid="${id}"]`) // Bundles on app pages
                || document.querySelector(`.game_area_purchase_game[data-ds-bundleid="${id}"]`); // Bundles on bundle pages
        }

        if (anchor) {
            new PriceOverview({
                target: anchor.parentElement!,
                anchor,
                props: {data}
            });
        }
    }

    private insertBundles(data: TBundle[]) {
        const anchor = document.querySelector("#game_area_purchase")?.nextElementSibling;
        if (anchor) {
            new BundleOverview({
                target: anchor.parentElement!,
                anchor,
                props: {data}
            });
        }
    }

    override async apply(): Promise<void> {
        const prices = new Prices(this.context.user);

        let subs: number[] = this.context.getAllSubids().map(Number);
        let bundles: number[] = [];
        for (const node of document.querySelectorAll<HTMLElement>("[data-ds-bundleid]")) {
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
                    this.insertPrices(type, id, data);
                }
                this.insertBundles(bundles);
            });
    }
}
