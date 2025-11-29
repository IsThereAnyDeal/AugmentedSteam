<script lang="ts">
    import CInventory, {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
    import Settings from "@Options/Data/Settings";
    import FOneClickGemsOption from "@Content/Features/Community/Inventory/Components/FOneClickGemsOption.svelte";
    import {onMount} from "svelte";
    import FEquipProfileItems from "@Content/Features/Community/Inventory/Components/FEquipProfileItems.svelte";
    import FQuickSellOptions from "@Content/Features/Community/Inventory/Components/FQuickSellOptions.svelte";

    export let context: CInventory;

    let marketInfo: MarketInfo;
    let showQuickSell: boolean = false;
    let showEquip: boolean = false;
    let show1ClickGoo: boolean = false;


    onMount(() => {
        context.onMarketInfo.subscribe(e => {
            marketInfo = e.data;
            const {
                marketAllowed,
                walletCurrency,
                marketable,
                itemType,
                appid,
                assetId,
                hasGooOption
            } = marketInfo;

            showQuickSell = Settings.quickinv && marketAllowed && marketable && walletCurrency !== 0;

            showEquip = Boolean(assetId) && [
                "profilebackground",
                "profilemodifier",
                "miniprofilebackground",
                "avatarframe",
                "animatedavatar",
                "keyboardskin"
            ].includes(itemType);

            show1ClickGoo = Boolean(Settings.show1clickgoo && appid && hasGooOption);
        });
    });
</script>


{#key marketInfo}
    {#if showQuickSell || show1ClickGoo || showEquip}
        <div class="container">
            {#if showQuickSell}
                <FQuickSellOptions {marketInfo} />
            {/if}

            {#if show1ClickGoo}
                <FOneClickGemsOption
                    appid={marketInfo.appid}
                    assetId={marketInfo.assetId}
                    sessionId={marketInfo.sessionId}
                />
            {/if}

            {#if showEquip && marketInfo.assetId}
                <FEquipProfileItems user={context.user} {marketInfo} />
            {/if}
        </div>
    {/if}
{/key}


<style>
    .container {
        width: 346px;
        box-sizing: border-box;
        background: radial-gradient(ellipse at center top, #333333, #1e1e1e);
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
</style>