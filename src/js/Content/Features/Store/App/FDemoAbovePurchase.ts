import self_ from "./FDemoAbovePurchase.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import {mount} from "svelte";

/**
 * Demo links may appear in the main section above purchase options, or in the right column as a small button.
 * This feature will try to normalize this and add a demo link to the main section if there isn't one already.
 *
 * Demo in main section: https://store.steampowered.com/app/220/HalfLife_2/
 * Demo link in sidebar: https://store.steampowered.com/app/1297900/Gothic_1_Remake/
 */
export default class FDemoAbovePurchase extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        // FIXME settings
        return true;
    }

    override async apply(): Promise<void> {
        const demoLink = document.querySelector<HTMLAnchorElement>(".download_demo_button a.btn_medium")?.href.slice(11) ?? null;
        if (!demoLink) {
            // no demo found
            throw new Error("No demo found");
        }

        const demoAbovePurchase = document.querySelector(".demo_above_purchase") !== null;
        if (demoAbovePurchase) {
            // There already is a demo above purchase section.
            return;
        }

        // Determine available platforms from system requirements
        const windows: boolean = document.querySelector("[data-os=win]") !== null;
        const mac: boolean     = document.querySelector("[data-os=mac]") !== null;
        const linux: boolean   = document.querySelector("[data-os=linux]") !== null;

        const purchaseNote = document.querySelector("#purchase_note");

        let target: Element;
        let anchor: Element|undefined;
        if (purchaseNote) {
            target = purchaseNote.parentElement!;
            anchor = target.nextElementSibling ?? undefined;
        } else {
            const areaPurchase = document.querySelector("#game_area_purchase");
            if (!areaPurchase) {
                throw new Error("Node not found");
            }

            target = areaPurchase;
            anchor = areaPurchase.firstElementChild ?? undefined;
        }

        mount(self_, {
            target,
            anchor,
            props: {
                appName: this.context.appName,
                windows,
                mac,
                linux,
                demoLink
            }
        });
    }
}
