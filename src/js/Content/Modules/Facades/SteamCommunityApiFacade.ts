import {BackgroundSender} from "../../../Core/BackgroundSimple";
import type {TFetchBadgeInfoMessage, TFetchBadgeInfoResponse} from "../../../Background/Modules/Community/_types";

export default class SteamCommunityApiFacade {

    static async fetchBadgeInfo(steamId: string, appid: number): Promise<TFetchBadgeInfoResponse> {
        return await BackgroundSender.send<TFetchBadgeInfoMessage, TFetchBadgeInfoResponse>({
            action: "community.badgeinfo",
            params: {steamId, appid}
        });
    }
}
