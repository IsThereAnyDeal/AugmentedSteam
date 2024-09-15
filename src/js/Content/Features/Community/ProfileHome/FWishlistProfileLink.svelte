<script lang="ts">
    import {onMount} from "svelte";
    import {__wishlist} from "@Strings/_strings";
    import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
    import Settings from "@Options/Data/Settings";
    import {L} from "@Core/Localization/Localization";

    let countPromise: Promise<string|null>;

    const formatter = new Intl.NumberFormat(document.documentElement.lang || navigator.language);

    onMount(() => {
        countPromise = (async () => {
            if (Settings.show_wishlist_count) {

                // Check for wishlist stats in the game collector showcase
                const valueNode = document.querySelector('.gamecollector_showcase .showcase_stat[href$="/wishlist/"] .value');
                if (valueNode !== null) {
                    return valueNode.textContent!.trim();
                }

                const count = await SteamStoreApiFacade.fetchWishlistCount(window.location.pathname);
                if (count !== null) {
                    return formatter.format(count);
                }
            }
            return null;
        })();
    });
</script>


<div class="profile_count_link ellipsis">
    <a href="//store.steampowered.com/wishlist{window.location.pathname}">
        <span class="count_link_label">{L(__wishlist)}</span>&nbsp;
        <span class="profile_count_link_total">
            {#await countPromise then value}
                {#if value !== null}{value}{/if}
            {/await}
        </span>
    </a>
</div>
