<svelte:options immutable={false} />

<script lang="ts">
    import {__favEmoticonsDragging, __favEmoticonsNoAccess, __loading} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {onMount} from "svelte";
    import SyncedStorage from "@Core/Storage/SyncedStorage";
    import {handleDrag} from "@Content/Features/Community/FFavoriteEmoticons";

    export let emoticonPopup: HTMLElement;

    let promise: Promise<void> = Promise.resolve();
    let favs: string[] = [];

    let favBox: HTMLDivElement;
    let overBox: boolean = false;
    let overRemove: boolean = false;

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
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="commentthread_entry_quotebox es_fav_remove"
         class:is-over={overRemove}
         on:dragover|preventDefault={() => overRemove = true}
         on:dragenter={() => overRemove = true}
         on:dragleave={() => overRemove = false}
         on:drop|preventDefault={removeFavorite}
    ></div>

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div bind:this={favBox}
         class="commentthread_entry_quotebox es_fav_emoticons"
         class:is-over={overBox}
         on:dragover|preventDefault={() => overBox = true}
         on:dragenter|preventDefault={() => overBox = true}
         on:dragleave={leaveBox}
         on:drop|preventDefault={addFavorite}
    >

        {#await promise}
            {L(__loading)}
        {:then _}
            {#each favs as name}
                <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
                <div class="emoticon_option es_fav"
                     data-emoticon={name}
                     draggable="true"
                     on:dragstart={handleDrag}
                     on:click={handleClick}>

                    <!-- svelte-ignore a11y-missing-attribute -->
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
