import {SyncedStorage} from "../../../../modulesCore";

class UserNotesAdapter {

    static get adapter() {

        let adapter = new UserNotesAdapter.adapters[SyncedStorage.get("user_notes_adapter")]();

        if (typeof adapter === "undefined") {
            SyncedStorage.remove("user_notes_adapter");
            adapter = new UserNotesAdapter.adapters[SyncedStorage.defaults.user_notes_adapter]();
        }

        return adapter;
    }
}

class OutOfCapacityError extends Error {
    constructor(...params) {
        super(...params);

        this.name = this.constructor.name;
    }
}

class CapacityInfo {
    constructor(closeToFull = false, utilization = null) {
        this.closeToFull = closeToFull;
        this.utilization = utilization;
    }
}

class SyncedStorageAdapter {

    constructor() {
        this._notes = SyncedStorage.get("user_notes");
    }

    get(appid) {
        return this._notes[appid];
    }

    set(appid, note) {

        const oldNote = this._notes[appid];
        this._notes[appid] = note;

        const storageUsage = this._getNotesSize() / SyncedStorage.QUOTA_BYTES_PER_ITEM;
        if (storageUsage > 1) {
            this._notes[appid] = oldNote;
            throw new OutOfCapacityError("Can't set this user note, out of capacity");
        }

        SyncedStorage.set("user_notes", this._notes);

        return new CapacityInfo(storageUsage > 0.85, storageUsage);
    }

    delete(appid) {
        delete this._notes[appid];
        SyncedStorage.set("user_notes", this._notes);
    }

    get data() {
        return this._notes;
    }

    set data(notes) {

        const storageUsage = this._getNotesSize(notes) / SyncedStorage.QUOTA_BYTES_PER_ITEM;
        if (storageUsage > 1) {
            throw new OutOfCapacityError("Import to synced storage failed, too much data for this adapter");
        }

        this._notes = notes;
        SyncedStorage.set("user_notes", this._notes);
    }

    _getNotesSize(notes = this._notes) {
        return "user_notes".length + JSON.stringify(notes).length;
    }
}

class IdbAdapter {


}

class ItadAdapter extends IdbAdapter {

}

UserNotesAdapter.adapters = Object.freeze({
    "synced_storage": SyncedStorageAdapter,
    "idb": IdbAdapter,
    "itad": ItadAdapter,
});

export {UserNotesAdapter};
