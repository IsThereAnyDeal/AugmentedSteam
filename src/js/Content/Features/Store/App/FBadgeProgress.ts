import self_ from "./FBadgeProgress.svelte";
import type {TFetchBadgeInfoResponse} from "@Background/Modules/Community/_types";
import SteamCommunityApiFacade from "../../../Modules/Facades/SteamCommunityApiFacade";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import { mount } from "svelte";

export default class FBadgeProgress extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.show_badge_progress
            && this.context.user.isSignedIn
            && !this.context.isDlcLike;
    }

    override async apply(): Promise<void> {
        const response: TFetchBadgeInfoResponse = await SteamCommunityApiFacade.fetchBadgeInfo(
            this.context.user.steamId,
            this.context.communityAppid
        );

        const data = response.badgedata;

        // No badge data if game doesn't have cards or not logged in
        if (!data) {
            return;
        }

        const categoryBlock = document.querySelector<HTMLElement>("#category_block");
        if (!categoryBlock) {
            throw new Error("Node not found");
        }

        mount(self_, {
            target: categoryBlock.parentElement!,
            anchor: categoryBlock.nextElementSibling ?? undefined,
            props: {data}
        });
    }
}
