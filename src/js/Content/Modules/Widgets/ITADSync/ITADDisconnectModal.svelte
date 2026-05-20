<script lang="ts">
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {L} from "@Core/Localization/Localization";
    import {__itad_expired, __itad_reauthorize} from "@Strings/_strings";
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";

    export let onclose: () => void;

    async function reauthorize(): Promise<void> {
        await ITADApiFacade.authorize();
        onclose();
    }

    async function oncancel(): Promise<void> {
        await ITADApiFacade.disconnect();
        onclose();
    }
</script>


<Modal title={L(__itad_expired)} showClose on:button={oncancel}>
    <button type="button" on:click={reauthorize}>
        {L(__itad_reauthorize)}
    </button>
</Modal>


<style>
    button {
        padding: 15px;
        border-radius: 8px;
        background: #1a1c21;
        border: 1px solid #333643;
        text-align: center;
        color: #dcdee8;
        font-size: 1.2em;
        width: 100%;
        box-sizing: border-box;

        &:hover {
            border: 1px solid #3c404e;
            color: white;
            cursor: pointer;
        }
    }
</style>