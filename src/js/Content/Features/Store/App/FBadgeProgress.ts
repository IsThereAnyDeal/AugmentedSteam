import self_ from "./FBadgeProgress.svelte";
import type {TFetchBadgeInfoResponse} from "@Background/Modules/Community/_types";
import SteamCommunityApiFacade from "../../../Modules/Facades/SteamCommunityApiFacade";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FBadgeProgress extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return !this.context.isDlcLike
            && this.context.user.isSignedIn
            && Settings.show_badge_progress;
    }

    override async apply(): Promise<void> {
        let response: TFetchBadgeInfoResponse = await SteamCommunityApiFacade.fetchBadgeInfo(
            this.context.user.steamId,
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
            anchor: target.querySelector("#category_block")?.nextElementSibling ?? undefined,
            props: {data}
        }));
    }
}
