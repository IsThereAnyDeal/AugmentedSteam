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