<script lang="ts" context="module">
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
</script>

<script lang="ts">
    let node: HTMLElement;
    let itemNodes: Array<[number, HTMLElement]> = [];

    export function getTarget(targetPosition: number): HTMLElement {
        let anchor: HTMLElement|null = null;

        for (const [position, itemNode] of itemNodes) {
            if (position === targetPosition) {
                return itemNode;
            }
            if (position > targetPosition) {
                anchor = itemNode;
                break;
            }
        }

        const newItem = document.createElement("div");
        if (anchor) {
            anchor.insertAdjacentElement("beforebegin", newItem);
        } else {
            node.appendChild(newItem);
        }
        itemNodes.push([targetPosition, newItem]);
        itemNodes.sort((a, b) => a[0]-b[0]);
        console.log(itemNodes);
        return newItem;
    }

</script>


<div bind:this={node}></div>


<style>
    div {
        display: flex;
        gap: 2px;
        margin-right: 15px;
    }
</style>