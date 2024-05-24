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

    _insertPrices(type: "app"|"sub"|"bundle", id: number, data: TPriceOverview) {
        let node: HTMLElement|null = null;
        let placement = "beforebegin";
        if (type === "sub") {
            node = document.querySelector<HTMLElement>(`input[name=subid][value="${id}"]`)
                ?.closest<HTMLElement>(".game_area_purchase_game") ?? null;
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

        if (!node) {
            console.error("Node for adding prices not found");
            return;
        }

        let target: Element = node.parentElement!;
        let anchor: Element|undefined = node;

        if (placement === "afterbegin") {
            target = node;
            anchor = node.firstElementChild ?? undefined;
        }

        (new PriceOverview({
            target,
            anchor,
            props: {data}
        }));
    }

    _insertBundles(data: TBundle[]) {
        const target = document.querySelector("#game_area_purchase");

        if (target) {
            const anchor = target.nextElementSibling;

            if (anchor) {
                new BundleOverview({
                    target: anchor.parentElement!,
                    anchor,
                    props: {data}
                });
            }
        }
    }

    override async apply(): Promise<void> {
        const prices = new Prices();

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
                    this._insertPrices(type, id, data);
                }
                this._insertBundles(bundles);
            });
    }
}
