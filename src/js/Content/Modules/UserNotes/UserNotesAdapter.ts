import Settings from "@Options/Data/Settings";
import type AdapterInterface from "@Content/Modules/UserNotes/Adapters/AdapterInterface";
import SyncedStorageAdapter from "@Content/Modules/UserNotes/Adapters/SyncedStorageAdapter";
import IdbAdapter from "@Content/Modules/UserNotes/Adapters/IdbAdapter";
import type {SettingsSchema} from "@Options/Data/_types";
import assertNever from "@Core/Asserts/AssertNever";

// TODO merge with UserNotes class?

export default class UserNotesAdapter {

    private static adapter: AdapterInterface;

    private static createAdapter(type: SettingsSchema["user_notes_adapter"]) {
        switch (type) {
            case "synced_storage":
                return new SyncedStorageAdapter();

            case "idb":
                return new IdbAdapter();

            default:
                assertNever(type);
        }
    }

    static getAdapter(): AdapterInterface {
        if (this.adapter === undefined) {
            this.adapter = this.createAdapter(Settings.user_notes_adapter);
        }
        return this.adapter;
    }

    static async changeAdapter(newType: SettingsSchema["user_notes_adapter"]): Promise<AdapterInterface> {
        const currentAdapter = this.getAdapter();
        if (newType === Settings.user_notes_adapter) {
            return currentAdapter;
        }

        const newAdapter = this.createAdapter(newType);

        await newAdapter.import(await currentAdapter.export());
        await currentAdapter.clear();

        Settings.user_notes_adapter = newType;

        this.adapter = newAdapter;
        return this.adapter;
    }
}
