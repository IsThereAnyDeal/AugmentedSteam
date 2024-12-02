<script lang="ts">
    import {__userNote_add} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
    import {onMount} from "svelte";

    export let notes: UserNotes;
    export let appName: string;
    export let appid: number;

    let note: string|null = null;
    let el: HTMLElement;

    async function handleEdit(): Promise<void> {
        let newNote: string|null = await notes.showModalDialog2(appName, appid,);
        if (newNote === "") {
            newNote = null;
        }
        note = newNote;
    }

    export function isConnected(): boolean {
        return el.isConnected;
    }

    onMount(() => {
        notes.get(appid).then(n => note = n.get(appid) ?? null);
    });
</script>


<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="as-note" data-appid={appid} bind:this={el} class:is-empty={!note} on:click={handleEdit}>
    {#if note !== undefined}
        {note ?? L(__userNote_add)}
    {/if}
</div>


<style>
    div {
        font-size: 11px;
        justify-self: flex-end;
        flex-grow: 1;
        text-align: right;
        cursor: pointer;
        color: #5fafdd;
    }
    div.is-empty {
        font-style: italic;
        color: #b2b8bd;
    }
    div:hover {
        color: white;
    }
</style>