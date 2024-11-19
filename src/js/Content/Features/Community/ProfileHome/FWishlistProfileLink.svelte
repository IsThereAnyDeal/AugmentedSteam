<script lang="ts">
    import {onMount} from "svelte";
    import {__wishlist} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Settings from "@Options/Data/Settings";
    import RequestData from "@Content/Modules/RequestData";

    export let steamid: string;

    let countPromise: Promise<string|null> = Promise.resolve(null);

    onMount(() => {
        if (Settings.show_wishlist_count) {
            countPromise = (async () => {
                // Check for wishlist stats in the game collector showcase
                const valueNode = document.querySelector('.gamecollector_showcase .showcase_stat[href$="/wishlist/"] .value');
                if (valueNode !== null) {
                    return valueNode.textContent!.trim();
                }

                const data = await RequestData.getJson<{
                    response: {
                        count: number
                    }
                }>(`https://api.steampowered.com/IWishlistService/GetWishlistItemCount/v1/?steamid=${steamid}`, {credentials: "omit"});
                if (data.response.count) {
                    // Don't show if count is 0
                    const formatter = new Intl.NumberFormat(document.documentElement.lang || navigator.language);
                    return formatter.format(data.response.count);
                }

                return null;
            })();
        }
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
