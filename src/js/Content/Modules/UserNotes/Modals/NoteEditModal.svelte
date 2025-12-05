<script lang="ts">
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {__cancel, __options_userNotes_saveWithEnter, __save, __userNote_addForGame} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {EModalAction} from "@Core/Modals/Contained/EModalAction";
    import {onMount, tick} from "svelte";
    import Settings from "@Options/Data/Settings";

    interface Props {
        appName: string;
        note: string;
        onsave: (note: string) => void;
        oncancel: () => void;
    }

    let {
        appName,
        note = $bindable(),
        onsave,
        oncancel
    }: Props = $props();

    let textareaNode: HTMLTextAreaElement;

    async function handleButton(action: EModalAction): Promise<void> {
        if (action === EModalAction.OK) {
            onsave(note);
        } else {
            oncancel();
        }
    }

    function escapeListener(e: KeyboardEvent) {
        if (e.code === "Escape") {
            oncancel();
        }
    }

    function textareaListener(e: KeyboardEvent) {
        if (e.code !== "Enter") {
            return;
        }

        if (Settings.user_notes_simple) {
            e.preventDefault();
            if (e.shiftKey) {
                const cursor = textareaNode.selectionEnd;
                note = note.substring(0, cursor) + "\n" + note.substring(cursor);
                tick().then(() => {
                    textareaNode.selectionEnd = cursor+1;
                });
            } else {
                onsave(note);
            }
        } else {
            if (e.shiftKey) {
                e.preventDefault();
                onsave(note);
            }
        }
    }

    function onfocus(): void {
        textareaNode.addEventListener("keypress", textareaListener);
    }

    function onblur(): void {
        textareaNode.removeEventListener("keypress", textareaListener);
    }

    onMount(() => {
        textareaNode.focus();
        document.addEventListener("keyup", escapeListener);

        return () => {
            document.removeEventListener("keyup", escapeListener);
        };
    });
</script>


<Modal title={L(__userNote_addForGame, {"gamename": appName})} buttons={{
    primary: L(__save),
    cancel: L(__cancel)
}} onbutton={handleButton}>
    <div>
        <textarea bind:this={textareaNode} bind:value={note} {onfocus} {onblur}></textarea>
    </div>

    <label><input type="checkbox" bind:checked={Settings.user_notes_simple}> {L(__options_userNotes_saveWithEnter)}</label>
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

    label {
        font-size: 14px;
    }
</style>