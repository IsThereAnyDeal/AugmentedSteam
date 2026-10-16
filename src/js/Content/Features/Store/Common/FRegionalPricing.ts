import self_ from "./FRegionalPricing.svelte";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import ServiceFactory from "@Protobufs/ServiceFactory";
import type CApp from "@Content/Features/Store/App/CApp";
import type {CStoreBrowse_GetItems_Response, StoreItem_PurchaseOption} from "@Protobufs/Compiled/proto.bundle";
import {mount} from "svelte";

export default class FRegionalPricing extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        const countries = Settings.regional_countries;
        return countries && countries.length > 0 && Settings.showregionalprice !== "off";
    }

    override async apply(): Promise<void> {
        const countries = Settings.regional_countries;
        const localCountry = this.context.user.storeCountry.toLowerCase();

        if (!countries.includes(localCountry)) {
            countries.push(localCountry);
        }

        // [packageid][country] = price
        const priceMap: Map<number, Map<string, StoreItem_PurchaseOption.$Properties>> = new Map();

        await Promise.all(countries.map(async country => {
            const data: CStoreBrowse_GetItems_Response = await ServiceFactory.StoreBrowseService(this.context.user).getItems({
                context: {
                    language: this.context.language?.name ?? "english",
                    countryCode: country,
                    steamRealm: 1
                },
                dataRequest: {
                    includeAllPurchaseOptions: true
                },
                ids: [{appid: this.context.appid}]
            });

            for (const item of data.storeItems) {
                for (const option of item.purchaseOptions ?? []) {
                    if (!option.packageid) { continue; }

                    if (!priceMap.has(option.packageid)) {
                        priceMap.set(option.packageid, new Map());
                    }
                    priceMap.get(option.packageid)!.set(country, option);
                }
            }
        }));

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
    }
}
