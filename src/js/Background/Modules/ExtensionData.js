import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {IndexedDB} from "./IndexedDB";
import {CacheStorage} from "./CacheStorage";

class ExtensionData {
    static clearCache() {
        CacheStorage.clear();
        return IndexedDB.clear();
    }

    /*
     * TEMP(1.4.1)
     * TODO delete after few versions
     */
    static async moveNotesToSyncedStorage() {
        const idbNotes = Object.entries(await IndexedDB.getAll("notes"));

        const notes = SyncedStorage.get("user_notes");
        for (const [appid, note] of idbNotes) {
            notes[appid] = note;
        }
        SyncedStorage.set("user_notes", notes);
    }

    static getNote(appid) {
        return IndexedDB.get("notes", appid);
    }

    static setNote(appid, note) {
        // Preserve the integer appid
        return IndexedDB.put("notes", new Map([[appid, note]]));
    }

    static deleteNote(appid) {
        return IndexedDB.delete("notes", appid);
    }

    static getAllNotes() {
        return IndexedDB.getAll("notes");
    }

    static async setAllNotes(notes) {
        await ExtensionData.clearNotes();

        // Preserve the integer appid
        const map = new Map(Object.entries(notes).map(([appid, note]) => [Number(appid), note]));
        return IndexedDB.put("notes", map);
    }

    static clearNotes() {
        return IndexedDB.clear("notes");
    }
}

export {ExtensionData};
