<script lang="ts">
    import {tick} from "svelte";

    let node = $state() as HTMLElement;
    let itemNodes: Array<[number, HTMLElement]> = [];

    export async function getTarget(targetPosition: number): Promise<HTMLElement> {
        /* If the menu is mounted at the same time as we request target, we won't have node bound yet */
        await tick();

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
        return newItem;
    }
</script>


<div bind:this={node}></div>


<style>
    div {
        height: 25px;
        display: flex;
        gap: 2px;
        justify-content: flex-end;
        margin-top: -30px;
        margin-bottom: 10px;
        position: relative;
        z-index: 2;
    }
</style>