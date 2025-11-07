<script lang="ts">
    let node: HTMLElement = $state();
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
        height: 25px;
        display: flex;
        gap: 2px;
        justify-content: flex-end;
        margin-top: -20px;
        margin-bottom: 10px;
    }
</style>