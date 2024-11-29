import self_ from "./WishlistMenu.svelte";

let menuComponent: self_|undefined;

export function getMenuNode(): self_ {
    if (menuComponent) {
        return menuComponent;
    }
    const container = document.querySelector<HTMLElement>(".wA5EFNQ7hrU-");
    if (!container) {
        throw new Error("Didn't find menu container node");
    }

    menuComponent = new self_({
        target: container,
        anchor: container.firstElementChild ?? undefined
    });
    return menuComponent;
}
