<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__addToWishlist, __error, __onWishlist} from "@Strings/_strings";
    import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
    import ExtensionResources from "@Core/ExtensionResources";

    export let appid: number;
    export let wishlisted: boolean;

    let isLoading: boolean = false;
    let isError: boolean = false;

    async function handleClick(): Promise<void> {
        if (isLoading) { return; }
        isLoading = true;
        isError = false;

        try {
            if (wishlisted) {
                await SteamStoreApiFacade.wishlistRemove(appid);
            } else {
                await SteamStoreApiFacade.wishlistAdd(appid);
            }
            wishlisted = !wishlisted;
        } catch (e) {
            /**
             * We can't (easily) detect whether or not the user is logged in to the store,
             * therefore we're also not able to provide more details here
             */
            isError = true;
        } finally {
            isLoading = false;
        }
    }
</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<span class="wl_btn btnv6_blue_hoverfade btn_medium" on:click={handleClick} role="button" tabindex="0">
    <span>
        {#if isLoading}
            <img class="loading_img" src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="" />
        {:else if wishlisted}
            <img class="remove_img" src={ExtensionResources.getURL("img/remove.png")} alt="" />
            <img class="selected_img" src="https://store.cloudflare.steamstatic.com/public/images/v6/ico/ico_selected.png" alt="" />
        {/if}
        {wishlisted ? L(__onWishlist) : L(__addToWishlist)}
    </span>
</span>
{#if isError}
    <div class="fail">{L(__error)}</div>
{/if}


<style>
    .wl_btn:hover .remove_img {
        display: inline;
    }
    .remove_img,
    .wl_btn:hover .selected_img {
        display: none;
    }
    .loading_img {
        width: 16px;
        /* Makes the image more consistent with others */
        filter: brightness(350%);
    }
    img {
        margin: 7px 0;
        vertical-align: top;
    }
    .fail {
        position: absolute;
        right: 0;
        color: #c6d4df;
        font-weight: bold;
    }
</style>
