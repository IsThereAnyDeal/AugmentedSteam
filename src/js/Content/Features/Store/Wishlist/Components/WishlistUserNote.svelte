<script lang="ts">
    import {__userNote_add} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
    import {onMount} from "svelte";

    interface Props {
        notes: UserNotes;
        appName: string;
        appid: number;
    }

    let { notes, appName, appid }: Props = $props();

    let note: string|null = $state(null);
    let el = $state() as HTMLElement;

    async function onedit(): Promise<void> {
        let newNote: string|null = await notes.showModalDialog(appName, appid,);
        if (newNote === "") {
            newNote = null;
        }
        note = newNote;
    }

    export function isConnected(): boolean {
        return el.isConnected;
    }

    onMount(() => {
        (async () => {
            note = (await notes.get(appid)).get(appid) ?? null;
        })();
    });
</script>


<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div bind:this={el} class={["as-note", {"is-empty": !note}]} data-appid={appid} onclick={onedit}>
    {note ?? L(__userNote_add)}
</div>


<style>
    div {
        font-size: 11px;
        justify-self: flex-end;
        text-align: right;
        cursor: pointer;
        color: #9dacbc;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.is-empty {
            font-style: italic;
            color: #9dacbc;
        }

        &:hover {
            color: white;
        }
    }
</style>