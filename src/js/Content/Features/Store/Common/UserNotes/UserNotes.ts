import type CapacityInfo from "@Content/Modules/UserNotes/CapacityInfo";
import OutOfCapacityError from "@Content/Modules/UserNotes/OutOfCapacityError";
import UserNotesAdapter from "@Content/Modules/UserNotes/UserNotesAdapter";
import {L} from "@Core/Localization/Localization";
import {
    __save,
    __userNote_add,
    __userNote_addForGame,
    __userNote_closeOnStorage,
    __userNote_closeOnStorageDesc,
    __userNote_notEnoughSpace,
    __userNote_notEnoughSpaceDesc,
    __userNote_saveLocal,
    __userNote_saveSyncedStorage,
    __userNote_storageWarningDesc, __userNote_syncError,
} from "@Strings/_strings";
import type AdapterInterface from "@Content/Modules/UserNotes/Adapters/AdapterInterface";
import DOMHelper from "@Content/Modules/DOMHelper";
import Settings from "@Options/Data/Settings";
import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import NotesForm from "./NotesForm.svelte";

export default class UserNotes {

    private adapter: AdapterInterface;

    constructor() {
        this.adapter = UserNotesAdapter.getAdapter();
    }

    get(...appids: number[]): Promise<Map<number, string|null>> {
        return this.adapter.get(...appids);
    }

    export(): Promise<Record<number, string>> {
        return this.adapter.export();
    }

    private async set(appid: number, note: string): Promise<boolean> {
        let capInfo: CapacityInfo|null;

        try {
            capInfo = await this.adapter.set(appid, note);

            if (Settings.itad_sync_notes && await ITADApiFacade.isConnected()) {
                const status = await ITADApiFacade.pushNote(appid, note);
                if (status.errors.length != 0) {
                    const [, error, params] = status.errors[0]!;
                    await SteamFacade.showAlertDialog(
                        L(__userNote_syncError),
                        L(error, params)
                    );
                }
            }
        } catch (err) {
            if (err instanceof OutOfCapacityError) {
                return (await this.showOutOfCapacityDialog(true, err.ratio))
                    ? this.set(appid, note)
                    : false;
            }

            throw err;
        }

        if (capInfo !== null && capInfo.closeToFull) {
            await this.showOutOfCapacityDialog(false, capInfo.utilization);
        }

        return true;
    }

    private async delete(appid: number): Promise<void> {
        await this.adapter.delete(appid);

        if (Settings.itad_sync_notes && await ITADApiFacade.isConnected()) {
            await ITADApiFacade.deleteNote(appid);
        }
    }

    async showModalDialog(
        appName: string,
        appid: number,
        noteEl: HTMLElement,
        onNoteUpdate: (noteEl: HTMLElement, hasNote: boolean) => void
    ): Promise<void> {

        const STORAGE_KEY = `es_note_autosave_${appid}`;

        let form: NotesForm|undefined;
        const savedNote: string = (await this.get(appid))?.get(appid) ?? "";
        let note: string = window.sessionStorage.getItem(STORAGE_KEY) ?? savedNote;

        const observer = new MutationObserver(() => {
            const modal = document.querySelector("#as_notes_modal");
            if (modal) {
                form = new NotesForm({
                    target: modal,
                    props: {note}
                });
                form.$on("change", () => {
                    note = form!.note;
                });

                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true
        });

        const response = await SteamFacade.showConfirmDialog(
            L(__userNote_addForGame, {"gamename": appName}),
            `<div id="as_notes_modal"></div>`,
            {
                okButton: L(__save),
                explicitDismissal: true
            }
        );

        form?.$destroy();

        note = note.trim().replace(/\s\s+/g, " ");

        if (response === "OK") {
            window.sessionStorage.removeItem(STORAGE_KEY);
        } else {
            if (note !== "") {
                window.sessionStorage.setItem(STORAGE_KEY, note);
            }
            return;
        }

        if (note === savedNote) {
            return;
        }

        if (note === "") {
            this.delete(appid);
            noteEl.textContent = L(__userNote_add);
        } else {
            if (!await this.set(appid, note)) {
                window.sessionStorage.setItem(STORAGE_KEY, note);
                return;
            }
            noteEl.textContent = `"${note}"`;
        }

        onNoteUpdate(noteEl, note !== "");
    }

    private async showOutOfCapacityDialog(exceeded: boolean, ratio: number): Promise<boolean> {

        const desc
            = `${L(exceeded ? __userNote_notEnoughSpaceDesc : __userNote_closeOnStorageDesc, {perc: (ratio * 100).toFixed(0)})}
            <br>
            ${L(__userNote_storageWarningDesc)}`;

        const response = await SteamFacade.showConfirmDialog(
            L(exceeded ? __userNote_notEnoughSpace : __userNote_closeOnStorage),
            desc,
            {
                okButton: L(__userNote_saveLocal),
                cancelButton: L(__userNote_saveSyncedStorage),
                explicitConfirm: true,
                explicitDismissal: true
            }
        );

        if (response === "OK") {
            this.adapter = await UserNotesAdapter.changeAdapter("idb");
            return true;
        }

        return false;
    }
}
