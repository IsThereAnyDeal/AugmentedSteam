<script lang="ts">
    import type {TBadgeData} from "@Background/Modules/Community/_types";
    import {L} from "@Core/Localization/Localization";
    import {
        __badgeLevel,
        __badgeNotUnlocked,
        __badgeProgress,
        __cardsOwned, __viewBadge, __viewBadgeProgress
    } from "@Strings/_strings";
    import SidebarBox from "@Content/Features/Store/App/SidebarBox.svelte";

    interface Props {
        data: TBadgeData;
    }

    const { data }: Props = $props();

    const cardOwned = $derived(data.rgCards.filter(c => c.owned !== 0).length);
    const cardTotal = $derived(data.rgCards.length);

    const empty = $derived(data.level === 0);
</script>


<SidebarBox title={L(__badgeProgress)}>
    <div class="progress_block">
        <div class={["badge", {empty}]}>
            {#if empty}
                <div class="circle"></div>
                <div>
                    <div>{data.nextlevelname}</div>
                    <div>{L(__badgeNotUnlocked)}</div>
                </div>
            {:else}
                <img src={data.iconurl} class="badge_icon" alt="Badge">
                <div>
                    <div class="title">{data.name}</div>
                    <div>{L(__badgeLevel, {"level": data.level})}</div>
                </div>
            {/if}
        </div>

        <div class="cards_numbers">
            {L(__cardsOwned, {"owned": cardOwned, "possible": cardTotal})}
        </div>

        <div class="game_area_details_specs">
            <div class="icon">
                <img src="https:////store.steampowered.com/public/images/v6/ico/ico_cards.png" class="category_icon" alt="Cards icon">
            </div>
            <a href="https://steamcommunity.com/my/gamecards/{data.appid}/" class="name">
                {L(data.bMaxed ? __viewBadge : __viewBadgeProgress)}
            </a>
        </div>
    </div>
</SidebarBox>


<style>
    .progress_block {
        overflow: hidden;
    }

    .badge {
        display: grid;
        grid-template-columns: 80px 1fr;
        align-items: center;
        border: 1px solid #2d2b2b;
        border-radius: 3px;
        gap: 8px;
        font-size: 14px;
        color: #5c5c5c;
        padding: 12px;

        &.empty {
            grid-template-columns: 58px 1fr;
            padding: 0 12px;
        }

        & .circle {
            margin: 6px;
            border-radius: 23px;
            width: 46px;
            height: 46px;
            border: 2px dashed #656565;
        }

        & img {
            width: 80px;
            height: 80px;
            background: red;
        }

        & .title {
            color: #ffffff;
        }
    }

    .cards_numbers {
        padding: 8px 0 8px 44px;
        color: #67c1f5;
    }
</style>
