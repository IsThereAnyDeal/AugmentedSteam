import Feature from "@Content/Modules/Context/Feature";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import self_ from "@Content/Features/Community/Inventory/FInventoryFeatures.svelte";
import {mount} from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";
import Settings from "@Options/Data/Settings";

export default class FInventoryFeatures extends Feature<CInventory> {

    override async isEnabled(): Promise<boolean> {
        return Settings.quickinv
            || Settings.show1clickgoo
            || true // FIXME setting showEquip;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.myInventory) {
            return "Not your inventory";
        }

        const target = document.querySelector<HTMLElement>(".inventory_page_right");
        if (!target) {
            throw new MountTargetError();
        }

        mount(self_, {
            target,
            // anchor: document.querySelector(".inventory_page_right")!.firstElementChild,
            props: {
                context: this.context
            }
        });
        return null;
    }
}
