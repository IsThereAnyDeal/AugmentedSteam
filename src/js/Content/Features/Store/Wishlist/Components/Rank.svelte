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
        top: 2px;
        left: -5px;
        font-family: "Motiva Sans", sans-serif;
        font-size: 11px;
        color: hsla(from #b2b8bd h s l / 0.5);
        width: 0;
        display: flex;
        justify-content: flex-end;
        text-align: right;
        transition: color 200ms;
    }
    :global(div:hover) > div {
        color: #b2b8bd;
    }
</style>