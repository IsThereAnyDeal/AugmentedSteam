<script lang="ts">
    export let appid: number;
    export let rank: number|undefined;

    let node: HTMLElement;

    export function isConnected(): boolean {
        return node.isConnected;
    }
</script>


<div class="as-rank" data-appid={appid} bind:this={node}>{rank}</div>


<style>
    div {
        position: absolute;
        top: 0;
        left: 1px;
        font-size: 10px;
        font-family: Arial, sans-serif;
    }
</style>