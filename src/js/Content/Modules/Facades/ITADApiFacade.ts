import type {
    TCollectionCopy,
    TGetStoreListResponse,
    TInCollectionResponse,
    TInWaitlistResponse,
    TLastImportResponse,
    TNotesList,
    TPushNotesStatus,
    TSyncEvent
} from "@Background/Modules/IsThereAnyDeal/_types";
import Background from "@Core/Background";
import {EAction} from "@Background/EAction";
import browser from "webextension-polyfill";

const RequiredPermissions = {
    data_collection: ["websiteContent"]
};

export default class ITADApiFacade {
    private static async checkPermissions(): Promise<void> {
        // @ts-expect-error
        if (!__FIREFOX) {
            return;
        }

        const result = await Background.send<boolean>(EAction.ITAD_Permissions_Check);
        if (!result) {
            throw new Error("Missing permissions");
        }
    }

    private static async requestPermissions(): Promise<void> {
        // @ts-expect-error
        if (!__FIREFOX) {
            return;
        }

        // @ts-expect-error
        const response = await browser.permissions.request(RequiredPermissions);

        if (!response) {
            throw new Error("Missing permissions");
        }
    }

    static getStoreList(): Promise<TGetStoreListResponse> {
        return Background.send<TGetStoreListResponse>(EAction.StoreList);
    }

    static async authorize(): Promise<void> {
        await this.requestPermissions();
        return Background.send(EAction.Authorize);
    }

    static disconnect(): Promise<void> {
        return Background.send(EAction.Disconnect);
    }

    static isExpired(): Promise<boolean> {
        return Background.send(EAction.IsExpired);
    }

    static isConnected(): Promise<boolean> {
        return Background.send(EAction.IsConnected);
    }

    static async sync(force: boolean=false): Promise<void> {
        await this.checkPermissions();
        return Background.send(EAction.Sync, {force});
    }

    static getLastImport(): Promise<TLastImportResponse> {
        return Background.send(EAction.LastImport);
    }

    static getSyncEvents(): Promise<TSyncEvent[]> {
        return Background.send(EAction.SyncEvents);
    }

    static async inWaitlist(storeIds: string[]): Promise<TInWaitlistResponse> {
        await this.checkPermissions();
        return Background.send(EAction.InWaitlist, {storeIds});
    }

    static async addToWaitlist(...appids: number[]) {
        await this.checkPermissions();
        return Background.send(EAction.AddToWaitlist, {appids});
    }

    static async removeFromWaitlist(...appids: number[]) {
        await this.checkPermissions();
        return Background.send(EAction.RemoveFromWaitlist, {appids});
    }

    static async inCollection(storeIds: string[]): Promise<TInCollectionResponse> {
        await this.checkPermissions();
        return Background.send(EAction.InCollection, {storeIds});
    }

    static async getFromCollection(storeId: string): Promise<TCollectionCopy[]|null> {
        await this.checkPermissions();
        return Background.send(EAction.GetFromCollection, {storeId});
    }

    static async pullNotes(): Promise<number> {
        await this.checkPermissions();
        return Background.send(EAction.ITAD_Notes_Pull);
    }

    static async pushNotes(notes: TNotesList): Promise<TPushNotesStatus> {
        await this.checkPermissions();
        return Background.send(EAction.ITAD_Notes_Push, {notes});
    }

    /**
     * Just a convenience wrapper around PushNotes
     */
    static async pushNote(appid: number, note: string): Promise<TPushNotesStatus> {
        await this.checkPermissions();
        return Background.send(EAction.ITAD_Notes_Push, {notes: [[appid, note]]});
    }

    static async deleteNote(appid: number): Promise<void> {
        await this.checkPermissions();
        return Background.send(EAction.ITAD_Notes_Delete, {appids: [appid]});
    }
}
