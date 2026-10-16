import self_ from "./FAchievementBar.svelte";
import SteamApi from "../../../Modules/SteamApi";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import {mount} from "svelte";
import SelectorMap from "@Content/SelectorMap";

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
        const {unlocked, total, percentage} = await SteamApi.getAchievementsProgress(
            this.context.user,
            this.context.communityAppid
        );

        if (total === 0) {
            return;
        }

        const target = document.querySelector(SelectorMap.app.achievementBar);
        if (!target) {
            throw new Error("Node not found");
        }

        mount(self_, {
            target,
            props: {
                unlocked,
                total,
                percentage: Math.round(percentage)
            }
        });
    }
}
