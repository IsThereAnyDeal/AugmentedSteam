import {BackgroundSender} from "@Core/BackgroundSimple";
import type {TFetchBadgeInfoResponse} from "@Background/Modules/Community/_types";
import {EAction} from "@Background/Modules/Community/EAction";

export default class SteamCommunityApiFacade {

    static async fetchBadgeInfo(steamId: string, appid: number): Promise<TFetchBadgeInfoResponse> {
        return await BackgroundSender.send2(EAction.BadgeInfo, {steamId, appid});
    }
}
