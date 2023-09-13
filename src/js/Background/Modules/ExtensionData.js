import {IndexedDB} from "./IndexedDB";
import CacheStorage from "./CacheStorage";

class ExtensionData {
    static clearCache() {
        CacheStorage.clear();
        return IndexedDB.clear();
    }

    static async getNote(appids) {
        return IndexedDB.get("notes", appids);
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
