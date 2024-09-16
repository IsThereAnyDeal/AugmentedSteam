import type {
    TCollectionCopy,
    TGetStoreListResponse, TInCollectionResponse,
    TInWaitlistResponse,
    TLastImportResponse, TNotesList, TPushNotesStatus, TSyncEvent
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

    static sync(force: boolean=false): Promise<void> {
        return Background.send(EAction.Sync, {force});
    }

    static getLastImport(): Promise<TLastImportResponse> {
        return Background.send(EAction.LastImport);
    }

    static getSyncEvents(): Promise<TSyncEvent[]> {
        return Background.send(EAction.SyncEvents);
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

    static async getFromCollection(storeId: string): Promise<TCollectionCopy[]|null> {
        return Background.send(EAction.GetFromCollection, {storeId});
    }

    static async pullNotes(): Promise<number> {
        return Background.send(EAction.ITAD_Notes_Pull);
    }

    static async pushNotes(notes: TNotesList): Promise<TPushNotesStatus> {
        return Background.send(EAction.ITAD_Notes_Push, {notes});
    }

    /**
     * Just a convenience wrapper around PushNotes
     */
    static async pushNote(appid: number, note: string): Promise<TPushNotesStatus> {
        return Background.send(EAction.ITAD_Notes_Push, {notes: [[appid, note]]});
    }

    static async deleteNote(appid: number): Promise<void> {
        return Background.send(EAction.ITAD_Notes_Delete, {appids: [appid]});
    }
}
