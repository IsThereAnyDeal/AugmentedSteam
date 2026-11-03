import self_ from "./FRegionalPricing.svelte";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type {StoreItem_PurchaseOption} from "@Protobufs/Compiled/proto.bundle";
import {mount} from "svelte";
import type Context from "@Content/Modules/Context/Context";

// [packageid][country] = price
export type TPriceMap = Map<number, Map<string, StoreItem_PurchaseOption.$Properties>>;

export default abstract class FRegionalPricing<T extends Context> extends Feature<T> {

    override async isEnabled(): Promise<boolean> {
        const countries = Settings.regional_countries;
        return countries && countries.length > 0 && Settings.showregionalprice !== "off";
    }

    abstract getPriceMap(countries: string[]): Promise<TPriceMap>;

    override async apply(): Promise<string|null> {
        const countries = Settings.regional_countries;
        const localCountry = this.context.user.storeCountry.toLowerCase();

        if (!countries.includes(localCountry)) {
            countries.push(localCountry);
        }

        const priceMap: TPriceMap = await this.getPriceMap(countries);

        for (const [subid, prices] of priceMap.entries()) {
            const node = document.querySelector(`input[name=subid][value="${subid}"]`)
                ?.closest(".game_area_purchase_game_wrapper, .game_area_purchase, #game_area_purchase")
                ?.querySelector(".game_purchase_action")!;

            if (!node) {
                continue;
            }

            const purchaseArea = node.closest(".game_area_purchase_game")!;
            purchaseArea.classList.add("as_regional_prices");

            if (Settings.showregionalprice === "always") {
                purchaseArea.classList.add("as_regional_always");

                mount(self_, {
                    target: node.parentElement!,
                    anchor: node,
                    props: {
                        user: this.context.user,
                        countries,
                        prices
                    }
                });
            } else if (Settings.showregionalprice === "mouse") {
                const priceNode = node.querySelector(".price, .discount_prices")!;

                mount(self_, {
                    target: document.body,
                    props: {
                        user: this.context.user,
                        countries,
                        prices,
                        priceNode
                    }
                });
            }
        }

        return null;
    }
}
