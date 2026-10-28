import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Price from "@Content/Modules/Currency/Price";
import {mount} from "svelte";
import DLCCheckbox from "@Content/Features/Store/App/DLCCheckboxes/DLCCheckbox.svelte";
import SelectOptions from "@Content/Features/Store/App/DLCCheckboxes/SelectOptions.svelte";
import SubId from "@Core/GameId/SubId";
import {
    allDlcs,
    dlcPriceMap,
    ownedDlcs,
    wishlistedDlcs
} from "@Content/Features/Store/App/DLCCheckboxes/DLCStores.svelte";
import AddToCart from "@Content/Features/Store/App/DLCCheckboxes/AddToCart.svelte";

export default class FDLCCheckboxes extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<void> {
        // check if the page has at least one purchasable DLC available
        const dlcs = document.querySelector(".game_area_dlc_section .game_area_dlc_list input[name^=subid]");

        const dlcSection = document.querySelector(".game_area_dlc_section");
        if (!dlcSection) {
            return;
        }

        for (const dlcRow of dlcSection.querySelectorAll(".game_area_dlc_row")) {
            const subidNode = dlcRow.querySelector<HTMLInputElement>("input[name^=subid]");
            if (!subidNode) {
                continue;
            }

            const subid = new SubId(Number(subidNode.value));

            allDlcs.add(subid.number);

            if (dlcRow.classList.contains("ds_wishlist")) {
                wishlistedDlcs.add(subid.number);
            } else if (dlcRow.classList.contains("ds_owned")) {
                ownedDlcs.add(subid.number);
            }

            const priceNode = dlcRow.querySelector(".discount_final_price")
                ?? dlcRow.querySelector(".game_area_dlc_price");

            const price = !priceNode ? null : Price.parseFromString(priceNode.textContent!);
            if (price !== null) {
                dlcPriceMap.set(subid.number, price);
            }

            dlcRow.classList.add("as-dlc-row"); // needed for styling checkboxes

            mount(DLCCheckbox, {
                target: dlcRow,
                props: {
                    subid
                }
            });
        }

        mount(SelectOptions, {
            target: dlcSection,
            anchor: dlcSection.querySelector(".game_area_dlc_list")!
        });

        const dlcForm = dlcSection.querySelector("form")!;
        mount(AddToCart, {
            target: dlcForm,
        });
    }
}
