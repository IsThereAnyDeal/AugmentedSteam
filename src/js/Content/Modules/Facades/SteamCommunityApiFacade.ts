import Background from "@Core/Background";
import type {TFetchBadgeInfoResponse, TFetchReviewsResponse, TLogin} from "@Background/Modules/Community/_types";
import {EAction} from "@Background/EAction";

export default class SteamCommunityApiFacade {

    static fetchBadgeInfo(steamId: string, appid: number): Promise<TFetchBadgeInfoResponse> {
        return Background.send(EAction.BadgeInfo, {steamId, appid});
    }

    static getWorkshopFileSize(id: number, preventFetch: boolean): Promise<number|null> {
        return Background.send(EAction.WorkshopFileSize, {id, preventFetch});
    }

    static getReviews(steamId: string, pages: number): Promise<TFetchReviewsResponse> {
        return Background.send(EAction.Reviews, {steamId, pages});
    }

    static login(profilePath: string): Promise<TLogin> {
        return Background.send(EAction.Login, {profilePath});
    }

    static logout(force: boolean|undefined=undefined): Promise<void> {
        return Background.send(EAction.Logout, {force});
    }

    static setStoreCountry(newCountry: string): Promise<void> {
        return Background.send(EAction.StoreCountry_Set, {newCountry});
    }

    static getStoreCountry(): Promise<string|null> {
        return Background.send(EAction.StoreCountry_Get);
    }
}
