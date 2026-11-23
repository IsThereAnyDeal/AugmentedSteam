<script lang="ts">
    import {__viewFoilBadge, __viewNormalBadge, __visitStore, __visitTradeForum} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        appid: number,
        isFoil: boolean,
        isSaleAppid: boolean,
        wrap: boolean
    }

    const { appid, isFoil, isSaleAppid, wrap }: Props = $props();

    const url = $derived.by(() => {
        const url = new URL(window.location.href)
        if (isFoil) {
            url.searchParams.delete("border");
        } else {
            url.searchParams.set("border", "1");
        }
        return url;
    });
</script>


{#snippet links()}
    <div class="as-container">
        <a class="btn_grey_grey btn_medium" href={String(url)}>
            <span>
                {#if isFoil}
                    {L(__viewNormalBadge)}
                {:else}
                    {L(__viewFoilBadge)}
                {/if}
            </span>
        </a>

        {#if !isSaleAppid}
            <div>
                <a class="btn_grey_grey btn_medium" href="https://store.steampowered.com/app/{appid}/">
                    <span>{L(__visitStore)}</span>
                </a>
                <a class="btn_grey_grey btn_medium" href="https://steamcommunity.com/app/{appid}/tradingforum/">
                    <span>{L(__visitTradeForum)}</span>
                </a>
            </div>
        {/if}
    </div>
{/snippet}


{#if wrap}
    <div class="gamecards_inventorylink">{@render links()}</div>
{:else}
    {@render links()}
{/if}


<style>
    .as-container {
        margin-top: 5px;
        display: flex;
        justify-content: space-between;
        gap: 5px;
    }

    /* Layout for the case when zoomed in (and the buttons are wrapped) */
    .gamecards_inventorylink {
        overflow: auto;
        margin-bottom: 9px; /* Default is 14px => 14-5 = 9 */

        & a {
            margin-bottom: 5px;
        }
    }
</style>