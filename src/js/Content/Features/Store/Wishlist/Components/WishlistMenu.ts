import self_ from "./WishlistMenu.svelte";
import {mount} from "svelte";
import SelectorMap from "../../../../SelectorMap";
import {MountTargetError} from "@Core/Errors/Errors";

let menuComponent: self_|undefined;

export function getMenuNode(): self_ {
    if (menuComponent) {
        return menuComponent;
    }

    const header = document.querySelector<HTMLElement>(SelectorMap.wishlist.header);
    if (!header) {
        throw new MountTargetError("Didn't find menu container node");
    }
    menuComponent = mount(self_, {
        target: header.parentElement!,
        anchor: header.nextElementSibling ?? undefined
    });
    return menuComponent;
}
