import Background from "@Core/Background";
import type {TFetchBadgeInfoResponse, TFetchReviewsResponse, TLogin} from "@Background/Modules/Community/_types";
import {EAction} from "@Background/EAction";

export default class SteamCommunityApiFacade {

    static async fetchBadgeInfo(steamId: string, appid: number): Promise<TFetchBadgeInfoResponse> {
        return await Background.send(EAction.BadgeInfo, {steamId, appid});
    }

    static async getWorkshopFileSize(id: number, preventFetch: boolean): Promise<number|null> {
        return await Background.send(EAction.WorkshopFileSize, {id, preventFetch});
    }

    static async getReviews(steamId: string, pages: number): Promise<TFetchReviewsResponse> {
        return await Background.send(EAction.Reviews, {steamId, pages});
    }

    static async login(profilePath: string): Promise<TLogin> {
        return await Background.send(EAction.Login, {profilePath});
    }

    static async logout(force: boolean|undefined=undefined): Promise<void> {
        return await Background.send(EAction.Logout, {force});
    }

    static async setStoreCountry(newCountry: string): Promise<void> {
        return await Background.send(EAction.StoreCountry_Set, {newCountry});
    }

    static async getStoreCountry(): Promise<string|null> {
        return await Background.send(EAction.StoreCountry_Get);
    }
}
