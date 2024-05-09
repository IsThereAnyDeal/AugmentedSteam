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

    static isConnected(): Promise<boolean> {
        return BackgroundSender.send2(EAction.IsConnected);
    }

    static sync(): Promise<void> {
        return BackgroundSender.send2(EAction.Sync);
    }

    static async inWaitlist(storeIds: string[]): Promise<TInWaitlistResponse> {
        return BackgroundSender.send2(EAction.InWaitlist, {storeIds});
    }

    static async inCollection(storeIds: string[]): Promise<TInCollectionResponse> {
        return BackgroundSender.send2(EAction.InCollection, {storeIds});
    }

    static getLastImport(): Promise<TLastImportResponse> {
        return BackgroundSender.send2(EAction.LastImport);
    }
}
