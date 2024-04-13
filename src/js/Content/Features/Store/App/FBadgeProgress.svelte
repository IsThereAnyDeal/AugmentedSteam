<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FBadgeProgress.svelte";
    import {SyncedStorage} from "../../../../modulesCore";
    import {Feature, User} from "../../../modulesContent";
    import type {CApp} from "./CApp";
    import type {TFetchBadgeInfoResponse} from "../../../../Background/Modules/Community/_types";
    import SteamCommunityApiFacade from "../../../Modules/Facades/SteamCommunityApiFacade";

    export class FBadgeProgress extends Feature<CApp> {

        override checkPrerequisites(): boolean {
            return !this.context.isDlcLike
                && User.isSignedIn
                && SyncedStorage.get("show_badge_progress");
        }

        override async apply(): Promise<void> {
            let response: TFetchBadgeInfoResponse = await SteamCommunityApiFacade.fetchBadgeInfo(
                User.steamId,
                this.context.communityAppid
            );

            let data = response.badgedata;

            // No badge data if game doesn't have cards or not logged in
            if (!data) {
                return;
            }

            let target = document.querySelector(".rightcol.game_meta_data");
            if (!target) {
                throw new Error("Node not found");
            }

            (new self_({
                target,
                anchor: target.querySelector("#category_block")?.nextElementSibling ?? null,
                props: {data}
            }));
        }
    }
</script>

<script lang="ts">
    import {Localization} from "../../../../modulesCore";
    import type {TBadgeData} from "../../../../Background/Modules/Community/_types";

    export let data: TBadgeData;

    let cardOwned = data.rgCards.filter(c => c.owned === 1).length;
    let cardTotal = data.rgCards.length;
</script>


<div class="block responsive_apppage_details_right heading">{Localization.str.badge_progress}</div>
<div class="block responsive_apppage_details_right">
    <div class="block_content_inner es_badges_progress_block">
        {#if data.level === 0}
            <div class="badge_empty_circle"></div>
            <div class="badge_empty_right">
                <div class="badge_empty_name">{data.nextlevelname}</div>
                <div class="badge_empty_name">{Localization.str.badge_not_unlocked}</div>
            </div>
        {:else}
            <div class="badge_info_image">
                <img src="{data.iconurl}" class="badge_icon" alt="Badge">
            </div>
            <div class="badge_info_description">
                <div class="badge_info_title">{data.name}</div>
                <div>{Localization.str.badge_level.replace("__level__", data.level)}</div>
            </div>
        {/if}
        <div class="es_cards_numbers">
            <div class="es_cards_owned">{Localization.str.cards_owned.replace("__owned__", cardOwned).replace("__possible__", cardTotal)}</div>
        </div>
        <div class="game_area_details_specs">
            <div class="icon"><img src="//store.steampowered.com/public/images/v6/ico/ico_cards.png" class="category_icon" alt="Cards icon"></div>
            <a href="//steamcommunity.com/my/gamecards/{data.appid}/" class="name">{data.bMaxed ? Localization.str.view_badge : Localization.str.view_badge_progress}</a>
        </div>
    </div>
</div>


<style>
    .es_badges_progress_block {
        overflow: hidden;
    }
    .badge_info_image {
        float: left;
        margin-right: 24px;
        width: 80px;
        height: 80px;
    }
    img.badge_icon {
        width: 80px;
        height: 80px;
    }
    .badge_info_description {
        margin-top: 18px;
    }
    .badge_info_title {
        color: #ffffff;
    }
    .badge_empty_circle {
        margin: 0px 46px 14px 8px;
        border-radius: 46px;
        width: 46px;
        height: 46px;
        border: 2px dashed #656565;
        float: left;
    }
    .badge_empty_right {
        margin-top: 8px;
    }
    .badge_empty_name {
        color: #5c5c5c;
    }
    .es_cards_numbers {
        padding-top: 10px;
        padding-bottom: 10px;
        margin-left: 44px;
        color: #67c1f5;
        clear: both;
    }
    .es_cards_owned {
        padding-top: 8px;
    }
</style>
