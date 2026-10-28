import Background from "@Core/Background";
import {EAction} from "@Background/EAction";
import type {HasItemResponse} from "@Background/Modules/Inventory/_types";

export default class InventoryApiFacade {

    static hasItem(hashes: string[]): Promise<HasItemResponse> {
        return Background.send(EAction.Inventory_HasItem, {hashes});
    }
}
