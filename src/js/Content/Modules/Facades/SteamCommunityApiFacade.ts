import BackgroundSender from "@Core/BackgroundSimple";
import type {TFetchBadgeInfoResponse, TLogin} from "@Background/Modules/Community/_types";
import {EAction} from "@Background/EAction";

export default class SteamCommunityApiFacade {

    static async fetchBadgeInfo(steamId: string, appid: number): Promise<TFetchBadgeInfoResponse> {
        return await BackgroundSender.send2(EAction.BadgeInfo, {steamId, appid});
    }

    static async login(profilePath: string): Promise<TLogin> {
        return await BackgroundSender.send2(EAction.Login, {profilePath});
    }

    static async logout(force: boolean|undefined=undefined): Promise<void> {
        return await BackgroundSender.send2(EAction.Logout, {force});
    }

    static async setStoreCountry(newCountry: string): Promise<void> {
        return await BackgroundSender.send2(EAction.StoreCountry_Set, {newCountry});
    }

    static async getStoreCountry(): Promise<string|null> {
        return await BackgroundSender.send2(EAction.StoreCountry_Get);
    }
}
