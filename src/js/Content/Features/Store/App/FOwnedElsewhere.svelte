<script lang="ts">
    import {__coll_inCollection, __ownedCollection} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import type {TCollectionCopy} from "@Background/Modules/IsThereAnyDeal/_types";
    import RedeemedIcon from "@Content/Features/Store/App/Icons/RedeemedIcon.svelte";
    import RedeemableIcon from "@Content/Features/Store/App/Icons/RedeemableIcon.svelte";

    export let appName: string;
    export let copies: TCollectionCopy[];
</script>


<div class="game_area_already_owned page_content">
    <div class="ds_owned_flag ds_flag">{L(__coll_inCollection).toUpperCase()}&nbsp;&nbsp;</div>
    <div class="already_in_library">
        {L(__ownedCollection, {"gametitle": appName})}

        {#each copies as copy}
            <div class="copy">
                <div class="icon">
                    {#if copy.redeemed}
                        <RedeemedIcon />
                    {:else}
                        <RedeemableIcon />
                    {/if}
                </div>

                <div class="shop">
                    <div>
                        {#if copy.shop}
                            {copy.shop}
                        {/if}
                    </div>
                    <div class="label">{copy.redeemed ? "redeemed" : "redeemable"}</div>
                </div>

                <div>
                    {#each copy.tags ?? [] as tag}
                        <span class="tag">{tag}</span>
                    {/each}
                    {#if copy.note}
                        <div class="note">{copy.note}</div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>


<style>
    .game_area_already_owned.page_content {
        min-height: 40px;
        height: auto !important;
        background-image: linear-gradient(to right, #bd9d1b 0%, #856d0e 100%) !important
    }
    .ds_owned_flag {
        background-color: #ffe000 !important;
    }
    .already_in_library {
        color: #ffe000;
    }

    .copy {
        display: flex;
        align-items: center;
        gap: 10px;
        border-top: 1px dashed #856d0e;
        font-size: 14px;
        line-height: 1;
        padding: 5px;
        color: #1b2838;
        fill: #1b2838;
    }
    .copy:last-child {
        margin-bottom: 5px;
        border-bottom: 1px dashed #856d0e;
    }

    .shop {
        min-width: 100px;
    }

    .icon {
        width: 17px;
        display: flex;
        align-items: center;
    }

    .label {
        font-size: 11px;
    }

    .tag {
        font-size: 12px;
        margin-right: 15px;
    }
    .note {
        font-size: 12px;
    }
</style>