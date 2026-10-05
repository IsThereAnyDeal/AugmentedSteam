<svelte:options immutable={false} />

<script lang="ts">
    import { preventDefault } from 'svelte/legacy';

    import {__favEmoticonsDragging, __favEmoticonsNoAccess, __loading} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {onMount} from "svelte";
    import SyncedStorage from "@Core/Storage/SyncedStorage";
    import {handleDrag} from "@Content/Features/Community/FFavoriteEmoticons";

    interface Props {
        emoticonPopup: HTMLElement;
    }

    let { emoticonPopup }: Props = $props();

    let promise: Promise<void> = $state(Promise.resolve());
    let favs: string[] = $state([]);

    let favBox: HTMLDivElement = $state();
    let overBox: boolean = $state(false);
    let overRemove: boolean = $state(false);

    function handleClick(e: MouseEvent): void {
        if (!e.target) {
            return;
        }

        const node = (<HTMLElement>(e.target)).closest<HTMLElement>(".emoticon_option");
        if (!node) {
            return;
        }

        const noFav = emoticonPopup.querySelector<HTMLElement>(`[data-emoticon=${node.dataset.emoticon}]:not(.es_fav)`);
        if (!noFav) {
            // The user doesn't have access to this emoticon
            e.stopPropagation();
            node.classList.add("no-access");
            const img = node.querySelector<HTMLImageElement>("img");
            if (img) {
                img.title = L(__favEmoticonsNoAccess);
            }
            return;
        }
        noFav.click();
    }

    function leaveBox(e: DragEvent): void {
        // Additional check to avoid background flicker when hovering over child elements, see https://stackoverflow.com/a/54960084
        if (e.relatedTarget && !favBox.contains(e.relatedTarget as HTMLElement)) {
            overBox = false;
        }
    }

    function addFavorite(e: DragEvent) {
        overBox = false;
        if (!e.dataTransfer) { return; }

        const name = e.dataTransfer.getData("emoticon");
        if (favs.includes(name)) { return; }

        favs.push(name);
        favs = favs;
        persistFavorites();
    }

    function removeFavorite(e: DragEvent): void {
        overRemove = false;
        const name = e.dataTransfer?.getData("emoticon");
        favs = favs.filter(fav => fav !== name);
        persistFavorites();
    }

    function persistFavorites(): void {
        SyncedStorage.set("fav_emoticons", favs);
    }

    onMount(() => {
        promise = (async () => {
            favs = (await SyncedStorage.get("fav_emoticons")) ?? [];
        })();
    });
</script>


<div class="emoticon_popup_content es_emoticons_content">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="commentthread_entry_quotebox es_fav_remove"
         class:is-over={overRemove}
         ondragover={preventDefault(() => overRemove = true)}
         ondragenter={() => overRemove = true}
         ondragleave={() => overRemove = false}
         ondrop={preventDefault(removeFavorite)}
    ></div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div bind:this={favBox}
         class="commentthread_entry_quotebox es_fav_emoticons"
         class:is-over={overBox}
         ondragover={preventDefault(() => overBox = true)}
         ondragenter={preventDefault(() => overBox = true)}
         ondragleave={leaveBox}
         ondrop={preventDefault(addFavorite)}
    >

        {#await promise}
            {L(__loading)}
        {:then _}
            {#each favs as name}
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                <div class="emoticon_option es_fav"
                     data-emoticon={name}
                     draggable="true"
                     ondragstart={handleDrag}
                     onclick={handleClick}>

                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img src="//community.cloudflare.steamstatic.com/economy/emoticon/{name}"
                         class="emoticon"
                         draggable="false" />
                </div>
            {:else}
                {L(__favEmoticonsDragging)}
            {/each}
        {/await}
    </div>
</div>


<style>
    /** Favorite emoticons */
    :global(.es_emoticons.emoticon_popup) {
        max-width: 352px;
    }
    .es_emoticons_content {
        margin-bottom: 10px;
        min-height: 32px;
        line-height: 32px;
        text-align: center;
        max-height: none;
        display: flex;
    }
    .es_emoticons_content :global(.no-access) {
        cursor: help;
        opacity: 0.4;
    }
    .es_fav_remove {
        width: 10%;
        background-image: url(https://community.cloudflare.steamstatic.com/economy/emoticon/remove);
        background-repeat: no-repeat;
        background-position: center;
    }
    .es_fav_emoticons {
        width: 90%;
    }

    .is-over {
        background-color: black;
    }
</style>
