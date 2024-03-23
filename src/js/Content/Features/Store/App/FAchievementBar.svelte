<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FAchievementBar.svelte";
    import {SyncedStorage} from "../../../../modulesCore";
    import {Feature, RequestData, User} from "../../../modulesContent";
    import type {CApp} from "./CApp";

    export class FAchievementBar extends Feature<CApp> {

        override checkPrerequisites(): boolean {
            return SyncedStorage.get("showachinstore")
                && this.context.hasAchievements
                && this.context.isOwnedAndPlayed;
        }

        override async apply(): Promise<void> {
            let response;

            try {
                const token = await User.accessToken;
                response = await RequestData.post(
                    `https://api.steampowered.com/IPlayerService/GetAchievementsProgress/v1/?access_token=${token}`,
                    {"steamid": User.steamId, "appids[0]": this.context.communityAppid},
                    {"credentials": "omit"}
                );
            } catch (err) {
                throw new Error("Failed to fetch achievements", {"cause": err});
            }

            response = response?.response?.achievement_progress?.[0];

            if (!response) {
                throw new Error("Failed to find achievements data");
            }

            /**
             * If you don't own the game, all values will be 0,
             * just as if you own the game but have no achievements,
             * so it's important to check for ownership `this.context.isOwnedAndPlayed`.
             */
            const {unlocked, total, percentage} = response;

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
        <div style="width: {percentage}%;" class="es_achievebar_progress"></div>
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
