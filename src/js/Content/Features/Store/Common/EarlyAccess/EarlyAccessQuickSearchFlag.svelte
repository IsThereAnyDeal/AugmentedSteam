<script lang="ts">
    import {__earlyAccess} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    let node = $state() as HTMLElement;

    export function isConnected(): boolean {
        return node.isConnected;
    }
</script>


<div bind:this={node}>{L(__earlyAccess)}</div>


<style>
    div {
        position: absolute;
        bottom: 5px;
        left: 0;
        z-index: 2;
        padding: 0 5px;
        background: #3f7294;
        color: #fff;
        font-family: "Motiva Sans";
        font-size: 11px;
        box-shadow: 0 0 5px 2px #0f1924;
    }
</style>
