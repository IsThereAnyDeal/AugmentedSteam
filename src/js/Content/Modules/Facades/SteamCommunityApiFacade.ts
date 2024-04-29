import {BackgroundSender} from "@Core/BackgroundSimple";
import type {TFetchBadgeInfoResponse} from "@Background/Modules/Community/_types";
import {EMessage} from "@Background/Modules/Community/EMessage";

export default class SteamCommunityApiFacade {

    static async fetchBadgeInfo(steamId: string, appid: number): Promise<TFetchBadgeInfoResponse> {
        return await BackgroundSender.send2(EMessage.BadgeInfo, {steamId, appid});
    }
}
