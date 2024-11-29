<svelte:options accessors />

<script lang="ts">
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher<{
        reposition: {appid: number, position: number};
    }>();

    export let appid: number;
    export let position: number|undefined;

    let node: HTMLElement;

    function reposition(e: Event): void {
        const newPosition = (e.target! as HTMLInputElement).value.trim();
        if (/^\d+$/.test(newPosition)) {
            dispatch("reposition", {appid, position: Number(newPosition)});
        }
    }

    export function isConnected(): boolean {
        return node.isConnected;
    }
</script>


<div bind:this={node}>
    <input type="text" value={position} on:change={reposition} data-appid={appid} />
</div>


<style>
    div {
        width: 40px;
        border-right: 1px solid rgba(0,0,0,.2);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
    }

    input {
        width: 22px;
        color: #b9bfc6;
        background-color: transparent;
        border-radius: 3px;
        font-size: 11px;
        padding: 3px 4px;
        border: none;
        text-align: center;
        transition: background-color .3s,box-shadow .3s;
        font-family: "Motiva Sans",Sans-serif;
        font-weight: 200;
    }
    div:hover input {
        background-color: #313c48;
        box-shadow: 1px 1px #0003 inset;
    }
</style>