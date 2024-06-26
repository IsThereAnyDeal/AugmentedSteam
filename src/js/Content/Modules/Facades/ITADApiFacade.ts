import type {
    TGetStoreListResponse, TInCollectionResponse,
    TInWaitlistResponse,
    TLastImportResponse
} from "@Background/Modules/IsThereAnyDeal/_types";
import Background from "@Core/Background";
import {EAction} from "@Background/EAction";

export default class ITADApiFacade {

    static getStoreList(): Promise<TGetStoreListResponse> {
        return Background.send<TGetStoreListResponse>(EAction.StoreList);
    }

    static authorize(): Promise<void> {
        return Background.send(EAction.Authorize);
    }

    static disconnect(): Promise<void> {
        return Background.send(EAction.Disconnect);
    }

    static isConnected(): Promise<boolean> {
        return Background.send(EAction.IsConnected);
    }

    static sync(): Promise<void> {
        return Background.send(EAction.Sync);
    }

    static getLastImport(): Promise<TLastImportResponse> {
        return Background.send(EAction.LastImport);
    }

    static async inWaitlist(storeIds: string[]): Promise<TInWaitlistResponse> {
        return Background.send(EAction.InWaitlist, {storeIds});
    }

    static async addToWaitlist(...appids: number[]) {
        return Background.send(EAction.AddToWaitlist, {appids});
    }

    static async removeFromWaitlist(...appids: number[]) {
        return Background.send(EAction.RemoveFromWaitlist, {appids});
    }

    static async inCollection(storeIds: string[]): Promise<TInCollectionResponse> {
        return Background.send(EAction.InCollection, {storeIds});
    }

    static async getFromCollection(storeId: string) {
        return Background.send(EAction.GetFromCollection, {storeId});
    }
}
