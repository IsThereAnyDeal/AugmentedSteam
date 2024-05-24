<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FAchievementBar.svelte";
    import SteamApi from "../../../Modules/SteamApi";
    import Settings from "@Options/Data/Settings";
    import Feature from "@Content/Modules/Context/Feature";
    import type CApp from "@Content/Features/Store/App/CApp";

    export class FAchievementBar extends Feature<CApp> {

        override checkPrerequisites(): boolean {
            /**
             * If you don't own the game, all values will be 0,
             * just as if you own the game but have no achievements,
             * so it's important to check for ownership `this.context.isOwnedAndPlayed`.
             */
            return Settings.showachinstore
                && this.context.hasAchievements
                && this.context.isOwnedAndPlayed;
        }

        override async apply(): Promise<void> {
            const {unlocked, total, percentage} = await SteamApi.getAchievementsProgress(this.context.communityAppid);

            const target = document.querySelector("#my_activity")!;

            (new self_({
                target,
                anchor: target.firstElementChild ?? undefined,
                props: {
                    unlocked,
                    total,
                    percentage: Math.round(percentage)
                }
            }));
        }
    }
</script>

<script lang="ts">
    import {__achievements_summary} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let unlocked: number;
    export let total: number;
    export let percentage: number;

    let achievementStr = L(__achievements_summary, {
        "unlocked": unlocked,
        "total": total,
        "percentage": percentage
    });
</script>


<div class="es_achievebar_ctn">
    <div>{achievementStr}</div>
    <div class="es_achievebar">
        <div style:width="{percentage}%" class="es_achievebar_progress"></div>
    </div>
</div>


<style>
    .es_achievebar_ctn {
        float: right;
    }
    .es_achievebar {
        background: #3a3a3a;
        padding: 1px;
        border: 1px solid #aeaeae;
        width: 176.9px;
    }
    .es_achievebar_progress {
        height: 8px;
        background-color: #aeaeae;
    }
</style>
