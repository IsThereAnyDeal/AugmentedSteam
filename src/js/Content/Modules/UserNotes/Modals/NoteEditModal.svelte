<script lang="ts">
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {__cancel, __save, __userNote_addForGame} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {EModalAction} from "@Core/Modals/Contained/EModalAction";
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher<{
        save: string,
        cancel: void
    }>();

    export let appName: string;
    export let note: string;

    async function handleButton(e: CustomEvent<EModalAction>): Promise<void> {
        const action = e.detail;

        if (action === EModalAction.OK) {
            dispatch("save", note);
        } else {
            dispatch("cancel");
        }
    }
</script>


<Modal title={L(__userNote_addForGame, {"gamename": appName})} buttons={{
    primary: L(__save),
    cancel: L(__cancel)
}} on:button={handleButton}>
    <div>
        <textarea bind:value={note} />
    </div>
</Modal>


<style>
    div {
        background-color: rgba(0,0,0,0.2);
        border-radius: 3px;
        border: 1px solid #262627;
        box-shadow: 1px 1px 0 #39393a;
        color: #BFBFBF;
        margin-bottom: 6px;
        outline: none;
        padding: 4px 6px;
        width: 500px;
    }

    textarea {
        border: none;
        outline: none;
        background-color: transparent;
        color: #bfbfbf;
        box-shadow: none;
        width: 100%;
        height: 112px;
        font-size: 14px;
    }
</style>