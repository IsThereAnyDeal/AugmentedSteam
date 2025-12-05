<script lang="ts">
    import {__wait} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Modal from "./Modal.svelte";

    interface Props {
        title: string;
        status?: string|string[];
    }

    let { title, status = L(__wait) }: Props = $props();

    export {
    	title,
    	status,
    }
</script>


<Modal {title} onbutton={() => {}}>
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