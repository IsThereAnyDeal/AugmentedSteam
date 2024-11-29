import self_ from "./FRegionalPricing.svelte";
import type CSub from "@Content/Features/Store/Sub/CSub";
import Feature from "@Content/Modules/Context/Feature";
import RequestData from "@Content/Modules/RequestData";
import Settings from "@Options/Data/Settings";

export interface PackageDetailsPrice {
    currency: string,
    initial: number,
    final: number,
    discount_percent: number,
    individual: number
}

interface PackageDetails {
    [K: string]: {
        success: boolean,
        data: {
            price: PackageDetailsPrice
        }
    }
}

export default class FRegionalPricing extends Feature<CSub> {

    override checkPrerequisites(): boolean {
        const countries = Settings.regional_countries;
        return countries && countries.length > 0 && Settings.showregionalprice !== "off";
    }

    override async apply(): Promise<void> {

        const countries = Settings.regional_countries;
        const localCountry = this.context.user.storeCountry.toLowerCase();

        if (!countries.includes(localCountry)) {
            countries.push(localCountry);
        }

        // Store errors to avoid duplicate console warnings
        const errors = new Set<string>();

        for (const subid of this.context.getAllSubids()) {
            const prices: Record<string, PackageDetailsPrice> = {};

            await Promise.all(countries.map(async country => {
                const result = await RequestData.getJson<PackageDetails>(
                    `https://store.steampowered.com/api/packagedetails/?packageids=${subid}&cc=${country}`,
                    {"credentials": "omit"}
                );
                if (!result) { return; }

                const data = result[subid];
                if (!data || !data.success || !data.data.price) { return; }

                prices[country] = data.data.price;
            }));

            // For paid titles that have F2P versions with their own subid (see #894)
            if (prices[localCountry] === undefined) { continue; }

            const node = document.querySelector(`input[name=subid][value="${subid}"]`)!
                .closest(".game_area_purchase_game_wrapper, #game_area_purchase")!
                .querySelector(".game_purchase_action")!;

            const purchaseArea = node.closest(".game_area_purchase_game")!;
            purchaseArea.classList.add("es_regional_prices");

            if (Settings.showregionalprice === "always") {
                purchaseArea.classList.add("es_regional_always");

                (new self_({
                    target: node.parentElement!,
                    anchor: node,
                    props: {
                        user: this.context.user,
                        countries,
                        prices,
                        errors
                    }
                }));
            } else if (Settings.showregionalprice === "mouse") {
                const priceNode = node.querySelector(".price, .discount_prices")!;

                (new self_({
                    target: document.body,
                    props: {
                        user: this.context.user,
                        countries,
                        prices,
                        errors,
                        priceNode
                    }
                }));
            }
        }
    }
}
