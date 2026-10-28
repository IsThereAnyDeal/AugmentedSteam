import self_ from "./FAchievementBar.svelte";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import {mount} from "svelte";
import SelectorMap from "@Content/SelectorMap";
import ServiceFactory, {EOrigin} from "@Protobufs/ServiceFactory";

export default class FAchievementBar extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        /**
         * If you don't own the game, all values will be 0,
         * just as if you own the game but have no achievements,
         * so it's important to check for ownership `this.context.isOwnedAndPlayed`.
         */
        return Settings.showachinstore
            && this.context.isOwnedAndPlayed;
    }

    override async apply(): Promise<void> {
        const { achievementProgress } = await ServiceFactory.PlayerService(this.context.user, EOrigin.Store).getAchievementsProgress({
            steamid: this.context.user.steamIdLong,
            appids: [this.context.communityAppid]
        });

        if (!achievementProgress || achievementProgress.length === 0) {
            return;
        }

        const {unlocked, total, percentage} = achievementProgress[0]!;

        if (total === 0) {
            return;
        }

        const target = document.querySelector(SelectorMap.store.app.achievementBar);
        if (!target) {
            throw new Error("Node not found");
        }

        mount(self_, {
            target,
            props: {
                unlocked: unlocked!,
                total: total!,
                percentage: Math.round(percentage!)
            }
        });
    }
}
