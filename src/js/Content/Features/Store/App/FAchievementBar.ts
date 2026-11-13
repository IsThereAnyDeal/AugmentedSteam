import self_ from "./FAchievementBar.svelte";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import {mount} from "svelte";
import SelectorMap from "@Content/SelectorMap";
import ServiceFactory, {EOrigin} from "@Protobufs/ServiceFactory";
import {MountTargetError} from "@Core/Errors/Errors";
import dynamicNode from "@Content/Modules/DOM/DynamicNode";

interface TProps {
    unlocked: number,
    total: number
    percentage: number
}

export default class FAchievementBar extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        /**
         * If you don't own the game, all values will be 0,
         * just as if you own the game but have no achievements,
         * so it's important to check for ownership `this.context.isOwnedAndPlayed`.
         */
        return Settings.showachinstore
            && this.context.isOwnedAndPlayed;
    }

    override async apply(): Promise<string|null> {
        const { achievementProgress } = await ServiceFactory.PlayerService(this.context.user, EOrigin.Store).getAchievementsProgress({
            steamid: this.context.user.steamIdLong,
            appids: [this.context.communityAppid]
        });

        if (!achievementProgress || achievementProgress.length === 0) {
            return "No achievement progress found";
        }

        const {unlocked, total, percentage} = achievementProgress[0]!;

        if (total === 0) {
            return "No achievements found";
        }

        const props = {
            unlocked: unlocked!,
            total: total!,
            percentage: Math.round(percentage!)
        };

        // TODO settings
        const inSidebar = await this.#mountSidebar(props);
        const inActivity = await this.#mountActivity(props);

        if (!inSidebar && !inActivity) {
            throw new MountTargetError();
        } else if (!inSidebar) {
            return "Sidebar target not found";
        } else if (!inActivity) {
            return "Activity target not found";
        }

        return null;
    }

    async #mountActivity(props: TProps): Promise<boolean> {
        const target = await dynamicNode({
            selector: () => document.querySelector<HTMLElement>("#my_activity")
        });
        if (!target) {
            return false
        }
        mount(self_, {
            target,
            anchor: target.firstElementChild!,
            props: Object.assign(props, {inActivity: true})
        });
        return true;
    }

    async #mountSidebar(props: TProps): Promise<boolean> {
        const target = await dynamicNode({
            selector: () => document.querySelector<HTMLElement>(SelectorMap.store.app.achievementBar)
        });
        if (!target) {
            return false
        }
        mount(self_, {target, props});

        return true;
    }
}
