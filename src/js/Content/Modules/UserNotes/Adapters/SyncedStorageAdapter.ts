import type AdapterInterface from "@Content/Modules/UserNotes/Adapters/AdapterInterface";
import OutOfCapacityError from "@Content/Modules/UserNotes/OutOfCapacityError";
import CapacityInfo from "@Content/Modules/UserNotes/CapacityInfo";
import SyncedStorage from "@Core/Storage/SyncedStorage";

export default class SyncedStorageAdapter implements AdapterInterface{

    private async getNotesMap(): Promise<Map<number, string>> {
        return new Map<number, string>(
            Object.entries((await SyncedStorage.get("user_notes")) ?? {})
                .map(([appid, note]) => [Number(appid), note])
        );
    }

    async get(...appids: number[]): Promise<Map<number, string|null>> {

        const result = new Map<number, string|null>(
            appids.map(appid => [appid, null])
        );

        const notes = await SyncedStorage.get("user_notes");
        if (notes) {
            for (let [appidStr, note] of Object.entries(notes)) {
                const appid = Number(appidStr);
                if (!result.has(appid)) {
                    continue;
                }
                result.set(appid, note);
            }
        }

        return result;
    }

    async set(appid: number, note: string): Promise<CapacityInfo> {
        const notes = await this.getNotesMap();
        notes.set(appid, note);

        const notesObj = Object.fromEntries(notes.entries());

        const storageUsage = this.getNotesSize(notesObj) / SyncedStorage.QUOTA_BYTES_PER_ITEM;
        if (storageUsage > 1) {
            throw new OutOfCapacityError(storageUsage, "Can't set this user note, out of capacity");
        }

        await SyncedStorage.set("user_notes", notesObj);
        return new CapacityInfo(storageUsage > 0.85, storageUsage);
    }

    async delete(appid: number): Promise<void> {
        const notes = await this.getNotesMap();
        notes.delete(appid);

        return notes.size > 0
            ? SyncedStorage.set("user_notes", Object.fromEntries(notes.entries()))
            : SyncedStorage.remove("user_notes");
    }

    async export(): Promise<Record<string, string>> {
        const map = await this.getNotesMap();
        return Object.fromEntries(map.entries());
    }

    async import(notes: Record<string, string>): Promise<void> {
        const storageUsage = this.getNotesSize(notes) / SyncedStorage.QUOTA_BYTES_PER_ITEM;
        if (storageUsage > 1) {
            throw new OutOfCapacityError(storageUsage, "Import to synced storage failed, too much data for this adapter");
        }
        return SyncedStorage.set("user_notes", notes);
    }

    clear(): Promise<void> {
        return SyncedStorage.remove("user_notes");
    }

    private getNotesSize(notes: Record<number, string>): number {
        return "user_notes".length + JSON.stringify(notes).length;
    }
}
