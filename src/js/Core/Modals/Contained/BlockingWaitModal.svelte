<script lang="ts">
    import {__wait} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Modal from "./Modal.svelte";

    interface Props {
        title: string;
        statusFn?: () => string|string[];
    }

    let {
        title,
        statusFn
    }: Props = $props();

    let status: string|string[] = $state(L(__wait));

    export function update(): void {
        status = statusFn?.() ?? L(__wait);
    }
</script>


<Modal {title}>
    <div>
        <i></i>
        {#if typeof status === "string"}
            {status}
        {:else}
            {#each status as statusStr}
                <div>{statusStr}</div>
            {/each}
        {/if}
    </div>
</Modal>


<style>
    div {
        line-height: 32px;
    }

    i {
        display: block;
        width: 32px;
        height: 32px;
        background: url( 'https://community.fastly.steamstatic.com/public/images/login/throbber.gif' ) center center no-repeat;
        margin-right: 5px;
        float: left;
    }
</style>