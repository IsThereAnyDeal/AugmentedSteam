<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FAchievementBar.svelte";
    import {SyncedStorage} from "../../../../modulesCore";
    import {Feature} from "../../../modulesContent";
    import type {CApp} from "./CApp";
    import SteamApi from "../../../Modules/SteamApi";

    export class FAchievementBar extends Feature<CApp> {

        override checkPrerequisites(): boolean {
            /**
             * If you don't own the game, all values will be 0,
             * just as if you own the game but have no achievements,
             * so it's important to check for ownership `this.context.isOwnedAndPlayed`.
             */
            return SyncedStorage.get("showachinstore")
                && this.context.hasAchievements
                && this.context.isOwnedAndPlayed;
        }

        override async apply(): Promise<void> {
            const {unlocked, total, percentage} = await SteamApi.getAchievementsProgress(this.context.communityAppid);

            const target = document.querySelector("#my_activity")!;

            (new self_({
                target,
                anchor: target.firstElementChild,
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
    import {Localization} from "../../../../modulesCore";

    export let unlocked: number;
    export let total: number;
    export let percentage: number;

    let achievementStr = Localization.str.achievements.summary
        .replace("__unlocked__", unlocked)
        .replace("__total__", total)
        .replace("__percentage__", percentage);
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
