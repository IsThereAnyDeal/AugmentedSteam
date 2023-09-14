import {SyncedStorage} from "../../modulesCore";
import {BackgroundSimple} from "../BackgroundSimple";

class UserNotesAdapter {

    static getAdapter() {

        if (typeof UserNotesAdapter._adapter === "undefined") {

            let Adapter = UserNotesAdapter.adapters[SyncedStorage.get("user_notes_adapter")];

            if (typeof Adapter === "undefined") {
                SyncedStorage.remove("user_notes_adapter");
                Adapter = UserNotesAdapter.adapters[SyncedStorage.defaults.user_notes_adapter];
            }

            UserNotesAdapter._adapter = new Adapter();
        }

        return UserNotesAdapter._adapter;
    }

    static async changeAdapter(toType) {

        const currentAdapter = UserNotesAdapter.getAdapter();
        const newAdapter = new UserNotesAdapter.adapters[toType]();

        await newAdapter.import(await currentAdapter.export());
        await currentAdapter.clear();

        UserNotesAdapter._adapter = newAdapter;
        return UserNotesAdapter._adapter;
    }
}

class OutOfCapacityError extends Error {
    constructor(ratio, ...params) {
        super(...params);

        this.name = this.constructor.name;

        this.ratio = ratio;
    }
}

class CapacityInfo {
    constructor(closeToFull = false, utilization = null) {
        this.closeToFull = closeToFull;
        this.utilization = utilization;
    }
}

class SyncedStorageAdapter {

    get(appid) {
        const isArray = Array.isArray(appid);
        const appids = isArray ? appid : [appid];

        const notes = SyncedStorage.get("user_notes");
        const res = appids.reduce((acc, val) => {
            acc[val] = notes[val];
            return acc;
        }, {});

        return isArray ? res : res[appid];
    }

    async set(appid, note) {
        const newNotes = {
            ...SyncedStorage.get("user_notes"),
            ...{[appid]: note}
        };

        const storageUsage = this._getNotesSize(newNotes) / SyncedStorage.QUOTA_BYTES_PER_ITEM;
        if (storageUsage > 1) {
            throw new OutOfCapacityError(storageUsage, "Can't set this user note, out of capacity");
        }

        await SyncedStorage.set("user_notes", newNotes);

        return new CapacityInfo(storageUsage > 0.85, storageUsage);
    }

    delete(appid) {
        const notes = SyncedStorage.get("user_notes");
        delete notes[appid];

        return SyncedStorage.set("user_notes", notes);
    }

    export() {
        return SyncedStorage.get("user_notes");
    }

    import(notes) {

        const storageUsage = this._getNotesSize(notes) / SyncedStorage.QUOTA_BYTES_PER_ITEM;
        if (storageUsage > 1) {
            throw new OutOfCapacityError(storageUsage, "Import to synced storage failed, too much data for this adapter");
        }

        return SyncedStorage.set("user_notes", notes);
    }

    clear() {
        return SyncedStorage.remove("user_notes");
    }

    _getNotesSize(notes = SyncedStorage.get("user_notes")) {
        return "user_notes".length + JSON.stringify(notes).length;
    }
}

class IdbAdapter {

    async get(appid) {
        const isArray = Array.isArray(appid);
        const appids = isArray ? appid : [appid];

        const res = await BackgroundSimple.action("notes.get", appids);

        return isArray ? res : res[appid];
    }

    set(appid, note) {
        return BackgroundSimple.action("notes.set", appid, note);
    }

    delete(appid) {
        return BackgroundSimple.action("notes.delete", appid);
    }

    export() {
        return BackgroundSimple.action("notes.getall");
    }

    import(notes) {
        return BackgroundSimple.action("notes.setall", notes);
    }

    clear() {
        return BackgroundSimple.action("notes.clear");
    }
}

/*
 * TODO Implement
 * class ItadAdapter extends IdbAdapter {}
 */

UserNotesAdapter.adapters = Object.freeze({
    "synced_storage": SyncedStorageAdapter,
    "idb": IdbAdapter,
    // "itad": ItadAdapter,
});

export {CapacityInfo, OutOfCapacityError, UserNotesAdapter};
