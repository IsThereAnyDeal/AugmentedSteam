import Feature from "@Content/Modules/Context/Feature";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import self_ from "@Content/Features/Community/Inventory/FInventoryFeatures.svelte";

export default class FInventoryFeatures extends Feature<CInventory> {

    override checkPrerequisites(): boolean | Promise<boolean> {
        return this.context.myInventory;
    }

    override apply(): void {
        new self_({
            target: document.querySelector(".inventory_page_right")!,
            // anchor: document.querySelector(".inventory_page_right")!.firstElementChild,
            props: {
                context: this.context
            }
        });
    }
}
