<script lang="ts">
    import {onMount} from "svelte";
    import {__wishlist} from "@Strings/_strings";
    import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
    import Settings from "@Options/Data/Settings";
    import {L} from "@Core/Localization/Localization";

    let countPromise: Promise<number|null> = Promise.resolve(null);

    const formatter = new Intl.NumberFormat("en-US"); // TODO this should be locale-aware

    onMount(() => {
        countPromise = (async () => {
            if (Settings.show_wishlist_count) {
                const wishlistNode = document.querySelector<HTMLAnchorElement>('.gamecollector_showcase .showcase_stat[href$="/wishlist/"]');

                return wishlistNode
                    ? Number(wishlistNode.textContent!.match(/\d+(?:,\d+)?/)![0].replace(",", ""))
                    : SteamStoreApiFacade.fetchWishlistCount(window.location.pathname);
            }
            return null;
        })();
    });
</script>


<div id="es_wishlist_link" class="profile_count_link ellipsis">
    <a href="//store.steampowered.com/wishlist{window.location.pathname}">
        <span class="count_link_label">{L(__wishlist)}</span>&nbsp;
        <span class="profile_count_link_total">
            {#await countPromise then value}
                {#if value !== null}{formatter.format(value)}{/if}
            {/await}
        </span>
    </a>
</div>
