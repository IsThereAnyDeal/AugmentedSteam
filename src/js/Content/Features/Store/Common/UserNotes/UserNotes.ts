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
    __userNote_storageWarningDesc,
    __userNote_syncError,
} from "@Strings/_strings";
import type AdapterInterface from "@Content/Modules/UserNotes/Adapters/AdapterInterface";
import Settings from "@Options/Data/Settings";
import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import NotesForm from "./NotesForm.svelte";
import CustomModal from "@Core/Modals/CustomModal";
import NoteEditModal from "@Content/Modules/UserNotes/Modals/NoteEditModal.svelte";
import ConfirmDialog from "@Core/Modals/ConfirmDialog";
import {EModalAction} from "@Core/Modals/Contained/EModalAction";

export default class UserNotes {

    private adapter: AdapterInterface;
    private cache: Map<number, string|null> = new Map();

    constructor() {
        this.adapter = UserNotesAdapter.getAdapter();
    }

    async get(...appids: number[]): Promise<Map<number, string|null>> {
        const result: Map<number, string|null> = new Map();
        let query: number[] = [];

        for (const appid of appids) {
            if (this.cache.has(appid)) {
                result.set(appid, this.cache.get(appid)!);
            } else {
                query.push(appid);
            }
        }

        if (query.length > 0) {
            const queried = await this.adapter.get(...query);
            for (let [appid, note] of queried) {
                result.set(appid, note);
                this.cache.set(appid, note);
            }
        }

        return result;
    }

    export(): Promise<Record<number, string>> {
        return this.adapter.export();
    }

    private async set(appid: number, note: string): Promise<boolean> {
        let capInfo: CapacityInfo|null;

        try {
            capInfo = await this.adapter.set(appid, note);
            this.cache.set(appid, note);

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
        this.cache.delete(appid);

        if (Settings.itad_sync_notes && await ITADApiFacade.isConnected()) {
            await ITADApiFacade.deleteNote(appid);
        }
    }

    /**
     * @deprecated
     */
    async showModalDialog(
        appName: string,
        appid: number,
        noteEl: HTMLElement,
        onNoteUpdate: (noteEl: HTMLElement, hasNote: boolean) => void
    ): Promise<void> {

        let form: NotesForm|undefined;
        const savedNote: string = (await this.get(appid))?.get(appid) ?? "";
        let note: string = savedNote;

        const response = await CustomModal({
            title: L(__userNote_addForGame, {"gamename": appName}),
            options: {
                okButton: L(__save),
                explicitDismissal: true
            },
            modalFn: (target) => {
                form = new NotesForm({
                    target,
                    props: {note}
                });
                form.$on("change", () => {
                    note = form!.note;
                });
                return form;
            }
        });

        note = note.trim().replace(/\s\s+/g, " ");

        if (response !== "OK") {
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
                return;
            }
            noteEl.textContent = `"${note}"`;
        }

        onNoteUpdate(noteEl, note !== "");
    }

    public async showModalDialog2(
        appName: string,
        appid: number
    ): Promise<string|null> {
        const savedNote: string = (await this.get(appid))?.get(appid) ?? "";

        return new Promise(resolve => {
            const modal = new NoteEditModal({
                target: document.body,
                props: {
                    appName,
                    note: savedNote
                }
            });
            modal.$on("save", (e) => {
                let note: string|null = e.detail.trim().replace(/\s\s+/g, " ");
                if (note === "") {
                    note = null;
                }

                if (!note) {
                    this.delete(appid);
                } else {
                    this.set(appid, note);
                }

                resolve(note);
                modal.$destroy();
            });
            modal.$on("cancel", () => {
                resolve(savedNote);
                modal.$destroy();
            });
        });
    }

    private async showOutOfCapacityDialog(exceeded: boolean, ratio: number): Promise<boolean> {

        const desc
            = `${L(exceeded ? __userNote_notEnoughSpaceDesc : __userNote_closeOnStorageDesc, {perc: (ratio * 100).toFixed(0)})}
            <br>
            ${L(__userNote_storageWarningDesc)}`;

        const confirm = new ConfirmDialog(
            L(exceeded ? __userNote_notEnoughSpace : __userNote_closeOnStorage),
            desc,
            {
                primary: L(__userNote_saveLocal),
                cancel: L(__userNote_saveSyncedStorage)
            }
        )
        const response = await confirm.show();

        if (response === EModalAction.OK) {
            this.adapter = await UserNotesAdapter.changeAdapter("idb");
            return true;
        }

        return false;
    }
}
