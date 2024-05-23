import type {
    TGetStoreListResponse, TInCollectionResponse,
    TInWaitlistResponse,
    TLastImportResponse
} from "@Background/Modules/IsThereAnyDeal/_types";
import BackgroundSender from "@Core/BackgroundSimple";
import {EAction} from "@Background/EAction";

export default class ITADApiFacade {

    static getStoreList(): Promise<TGetStoreListResponse> {
        return BackgroundSender.send2<TGetStoreListResponse>(EAction.StoreList);
    }

    static authorize(): Promise<void> {
        return BackgroundSender.send2(EAction.Authorize);
    }

    static disconnect(): Promise<void> {
        return BackgroundSender.send2(EAction.Disconnect);
    }

    static isConnected(): Promise<boolean> {
        return BackgroundSender.send2(EAction.IsConnected);
    }

    static sync(): Promise<void> {
        return BackgroundSender.send2(EAction.Sync);
    }

    static async inWaitlist(storeIds: string[]): Promise<TInWaitlistResponse> {
        return BackgroundSender.send2(EAction.InWaitlist, {storeIds});
    }

    static async addToWaitlist(...appids: number[]) {
        return BackgroundSender.send2(EAction.AddToWaitlist, {appids});
    }

    static async removeFromWaitlist(...appids: number[]) {
        return BackgroundSender.send2(EAction.RemoveFromWaitlist, {appids});
    }

    static async inCollection(storeIds: string[]): Promise<TInCollectionResponse> {
        return BackgroundSender.send2(EAction.InCollection, {storeIds});
    }

    static getLastImport(): Promise<TLastImportResponse> {
        return BackgroundSender.send2(EAction.LastImport);
    }
}
