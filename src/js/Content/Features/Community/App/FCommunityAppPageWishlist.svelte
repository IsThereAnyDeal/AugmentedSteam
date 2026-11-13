<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__addToWishlist, __error, __onWishlist} from "@Strings/_strings";
    import SteamStoreApiFacade from "@Content/Facades/SteamStoreApiFacade";
    import ExtensionResources from "@Core/ExtensionResources";

    interface Props {
        appid: number;
        wishlisted: boolean;
    }

    let { appid, wishlisted }: Props = $props();

    let isLoading: boolean = $state(false);
    let isError: boolean = $state(false);

    async function onclick(): Promise<void> {
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


<button type="button" {onclick}>
    <span>
        {#if isLoading}
            <img class="loading_img" src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="" />
        {:else if wishlisted}
            <img class="remove_img" src={ExtensionResources.getURL("img/remove.png")} alt="" />
            <img class="selected_img" src="https://store.cloudflare.steamstatic.com/public/images/v6/ico/ico_selected.png" alt="" />
        {/if}
        {wishlisted ? L(__onWishlist) : L(__addToWishlist)}
    </span>
</button>
{#if isError}
    <div class="fail">{L(__error)}</div>
{/if}


<style>
    button {
        border: 0;
        outline: 0;
        border-radius: 2px;
        padding: 1px 15px;
        display: inline-block;
        font-size: 15px;
        line-height: 30px;
        color: #67c1f5;
        background: #67c1f533;
        margin-left: 5px;
        cursor: pointer;

        &:hover {
            color: #fff;
            background: linear-gradient(-60deg, #417a9b 5%, #67c1f5 95%);
        }
    }
    img {
        margin: 7px 0;
        vertical-align: top;
    }

    .remove_img {
        display: none;

        button:hover & {
            display: inline;
        }
    }
    button:hover .selected_img {
        display: none;
    }

    .loading_img {
        width: 16px;
        filter: brightness(350%); /* makes the image more consistent with others */
    }

    .fail {
        position: absolute;
        right: 0;
        color: #d72e2e;
    }
</style>
