<script lang="ts" context="module">
    import self_ from "./FWishlistProfileLink.svelte";
    import {L} from "@Core/Localization/Localization";
    import CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
    import Feature from "@Content/Modules/Context/Feature";
    import Settings from "@Options/Data/Settings";

    export class FWishlistProfileLink extends Feature<CProfileHome> {

        override checkPrerequisites(): boolean {
            return !this.context.isPrivateProfile && Settings.show_wishlist_link;
        }

        override async apply(): Promise<void> {

            const node = document.querySelector(".profile_item_links .profile_count_link")!;
            new self_({
                target: node.parentElement!,
                anchor: node.nextElementSibling!
            });
        }
    }
</script>


<script lang="ts">
    import {onMount} from "svelte";
    import {__wishlist} from "@Strings/_strings";
    import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";

    let countPromise: Promise<number|null> = Promise.resolve(null);

    onMount(() => {
        countPromise = (async () => {
            if (Settings.show_wishlist_count) {
                const wishlistNode = document.querySelector<HTMLAnchorElement>('.gamecollector_showcase .showcase_stat[href$="/wishlist/"]');

                return wishlistNode
                    ? Number(wishlistNode.textContent!.match(/\d+(?:,\d+)?/)![0])
                    : SteamStoreApiFacade.fetchWishlistCount(window.location.pathname);
            }
            return null;
        })();
    });
</script>


<div id="es_wishlist_link" class="profile_count_link ellipsis">
    <a href="//store.steampowered.com/wishlist${window.location.pathname}">
        <span class="count_link_label">${L(__wishlist)}</span>&nbsp;
        <span class="profile_count_link_total">
            {#await countPromise then value}
                {#if value !== null}{value}{/if}
            {/await}
        </span>
    </a>
</div>
