import self_ from "./WishlistMenu.svelte";
import { mount } from "svelte";

let menuComponent: self_|undefined;

export function getMenuNode(): self_ {
    if (menuComponent) {
        return menuComponent;
    }
    const header = document.querySelector<HTMLElement>(".jfAmlCmNzHQ-");
    if (!header) {
        throw new Error("Didn't find menu container node");
    }

    menuComponent = mount(self_, {
            target: header.parentElement!,
            anchor: header.nextElementSibling ?? undefined
        });
    return menuComponent;
}
