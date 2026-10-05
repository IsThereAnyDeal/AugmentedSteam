<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__userNote_add, __userNote_update} from "@Strings/_strings";
    import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
    import {onMount} from "svelte";
    import UserNoteIcon from "@Content/Icons/UserNoteIcon.svelte";
    import DOMPurify from "dompurify";

    interface Props {
        notes: UserNotes;
        appName: string;
        appid: number;
    }

    let { notes, appName, appid }: Props = $props();

    let note: string|null = $state(null);

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

    function parseNote(note: string): string {
        return DOMPurify.sanitize(note, {ALLOWED_TAGS: []}) // remove all potential HTML first
            .replaceAll(/(https?:\/\/\S+)/g, "<a href='$1' target='_blank' rel='noopener'>$1</a>"); // then convert links
    }
</script>


<div class="container">
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <span class="label" onclick={handleNote}><UserNoteIcon /> {L(note ? __userNote_update : __userNote_add)}</span>

    {#if note}
        <span class="note">{@html parseNote(note)}</span>
    {/if}
</div>


<style>
    .container {
        border-top: 1px solid #15202c;
        padding: 6px 16px;
        background: linear-gradient(to right, rgba(48, 144, 206, 0.6) 0%, transparent 60%);
        display: flex;
        align-items: baseline;
        gap: 10px;
    }

    .label {
        cursor: pointer;
        margin-right: 16px;
        color: #67c1f5;
    }
    .label:hover {
        color: #fff;
    }
    .label :global(i) {
        fill: #67c1f5;
        width: 1.6em;
    }

    .note {
        display: inline-block;
        font-size: 1.1em;
        line-height: 1.2;
        white-space: pre-line;
    }
</style>