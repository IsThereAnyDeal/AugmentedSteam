import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {IndexedDB} from "./IndexedDB";

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
}

export {ExtensionData};
