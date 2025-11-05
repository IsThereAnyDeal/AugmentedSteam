<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__userNote_add, __userNote_update} from "@Strings/_strings";
    import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
    import {onMount} from "svelte";
    import UserNoteIcon from "@Content/Features/Store/App/Icons/UserNoteIcon.svelte";

    export let notes: UserNotes;
    export let appName: string;
    export let appid: number;

    let note: string|null = null;

    async function handleNote(): Promise<void> {
        let newNote: string|null = await notes.showModalDialog2(appName, appid);
        if (newNote === "") {
            newNote = null;
        }
        note = newNote;
    }

    onMount(() => {
        notes.get(appid).then(n => note = n.get(appid) ?? null);
    });
</script>


<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="container" on:click={handleNote}>
    <span class="label"><UserNoteIcon /> {L(note ? __userNote_update : __userNote_add)}</span>

    {#if note}
        <span class="note">{note}</span>
    {/if}
</div>


<style>
    .container {
        border-top: 1px solid #15202c;
        padding: 6px 16px;
        background: linear-gradient(to right, rgba(48, 144, 206, 0.6) 0%, transparent 60%);
        cursor: pointer;
    }
    .container:hover {
        background: rgba(48, 144, 206, 0.6);
    }

    .label {
        margin-right: 16px;
        color: #67c1f5;
    }
    .label :global(i) {
        fill: #67c1f5;
        width: 1.6em;
    }

    .container:hover .label {
        color: #fff;
    }

    .note {
        display: inline-block;
        font-size: 1.4em;
    }
</style>