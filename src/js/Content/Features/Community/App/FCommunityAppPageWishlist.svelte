<script lang="ts" context="module">
    import self_ from "./FCommunityAppPageWishlist.svelte";
    import Feature from "@Content/Modules/Context/Feature";
    import type CApp from "@Content/Features/Community/App/CApp";
    import User from "@Content/Modules/User";
    import DynamicStore from "@Content/Modules/Data/DynamicStore";
    import Settings from "@Options/Data/Settings";

    export class FCommunityAppPageWishlist extends Feature<CApp> {

        override checkPrerequisites(): boolean {
            return User.isSignedIn
                && Settings.wlbuttoncommunityapp
                && document.querySelector(".apphub_OtherSiteInfo") !== null;
        }

        override async apply(): Promise<void> {
            const appid = this.context.appid;
            if (!appid) {
                return;
            }

            const {owned, wishlisted} = await DynamicStore.getAppStatus(`app/${appid}`);
            if (owned) { return; }

            const target = document.querySelector(".apphub_OtherSiteInfo");
            if (!target) {
                return;
            }

            (new self_({
                target,
                props: {appid, wishlisted}
            }));
        }
    }
</script>

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__addToWishlist, __error, __onWishlist} from "@Strings/_strings";
    import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
    import ExtensionResources from "@Core/ExtensionResources";

    export let appid: number;
    export let wishlisted: boolean;

    let isLoading: boolean = false;
    let isError: boolean = false;

    async function handle(add: boolean): Promise<void> {
        if (isLoading) { return; }
        isLoading = true;
        isError = false;

        try {
            if (add) {
                await SteamStoreApiFacade.wishlistAdd(appid);
            } else {
                await SteamStoreApiFacade.wishlistRemove(appid);
            }
        } catch (e) {
            /**
             * We can't (easily) detect whether or not the user is logged in to the store,
             * therefore we're also not able to provide more details here
             */
            isError = true;
            console.error("Failed to add remove from wishlist");
        } finally {
            isLoading = false;
        }
    }
</script>


<!-- Whitespace intended, separates buttons -->
&nbsp;
<span class="as_btn_community_wishlist" class:loading={isLoading}>
    {#if wishlisted}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <a id="es_wishlist_success" class="btnv6_blue_hoverfade btn_medium" on:click={() => handle(false)} role="button" tabindex="0">
            <span>
                <img class="es-remove-wl" src={ExtensionResources.getURL("img/remove.png")} alt="" />
                <img class="es-loading-wl" src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="" />
                <img class="es-in-wl" src="https://store.cloudflare.steamstatic.com/public/images/v6/ico/ico_selected.png" alt="" />
                {L(__onWishlist)}
            </span>
        </a>
    {:else}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <a id="es_wishlist_add" class="btnv6_blue_hoverfade btn_medium" on:click={() => handle(true)} role="button" tabindex="0">
            <span>
                <img class="es-loading-wl" src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="" />
                {L(__addToWishlist)}
            </span>
        </a>
    {/if}

    {#if isError}
        <span id="es_wishlist_fail">
            <b>{L(__error)}</b>
        </span>
    {/if}
</span>


<style>
    .es-loading-wl {
        width: 16px;
        /* Makes the image more consistent with others */
        filter: brightness(350%);
    }
    #es_wishlist_success img,
    #es_wishlist_add img {
        margin: 7px 0;
        vertical-align: top;
    }
    #es_wishlist_fail {
        display: block;
        position: absolute;
        right: 0;
        color: #c6d4df;
    }
    .as_btn_community_wishlist:not(.loading) a:hover img.es-remove-wl {
        display: inline !important;
    }
    .as_btn_community_wishlist:not(.loading) img:not(.es-in-wl),
    .as_btn_community_wishlist.loading img:not(.es-loading-wl),
    .as_btn_community_wishlist:not(.loading) a:hover img:not(.es-remove-wl) {
        display: none;
    }
</style>
