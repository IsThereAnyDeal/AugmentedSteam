import CapacityInfo from "@Content/Modules/UserNotes/CapacityInfo";
import OutOfCapacityError from "@Content/Modules/UserNotes/OutOfCapacityError";
import UserNotesAdapter from "@Content/Modules/UserNotes/UserNotesAdapter";
import {L} from "@Core/Localization/Localization";
import {
    __cancel,
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

export default class UserNotes {

    private readonly noteModalTemplate: string;
    private _adapter: AdapterInterface;

    constructor() {
        this._adapter = UserNotesAdapter.getAdapter();

        this.noteModalTemplate
            = `<div class="es_note_prompt newmodal_prompt_with_textarea gray_bevel fullwidth">
                <textarea name="es_note_input" id="es_note_input" rows="6" cols="12">__note__</textarea>
            </div>`;
    }

    get(...appids: number[]): Promise<Map<number, string|null>> {
        return this._adapter.get(...appids);
    }

    export(): Promise<Record<number, string>> {
        return this._adapter.export();
    }

    async set(appid: number, note: string): Promise<boolean> {
        let capInfo = null;

        try {
            capInfo = await this._adapter.set(appid, note);

            if (Settings.itad_sync_notes && await ITADApiFacade.isConnected()) {
                const status = await ITADApiFacade.pushNote(appid, note);
                if (status.errors.length != 0) {
                    const errors = new Map(status.errors);
                    await SteamFacade.showAlertDialog(
                        L(__userNote_syncError),
                        L(errors.get(appid)!)
                    );
                }
            }
        } catch (err) {
            if (err instanceof OutOfCapacityError) {
                return (await this._showOutOfCapacityDialog(true, err.ratio))
                    ? this.set(appid, note)
                    : false;
            }

            throw err;
        }

        if (capInfo instanceof CapacityInfo && capInfo.closeToFull) {
            // @ts-ignore
            await this._showOutOfCapacityDialog(false, capInfo.utilization);
        }

        return true;
    }

    async delete(appid: number): Promise<void> {
        await this._adapter.delete(appid);

        if (Settings.itad_sync_notes && await ITADApiFacade.isConnected()) {
            await ITADApiFacade.deleteNote(appid);
        }
    }

    async showModalDialog(
        appname: string,
        appid: number,
        noteEl: HTMLElement,
        onNoteUpdate: (noteEl: HTMLElement, hasNote: boolean) => void
    ): Promise<void> {

        let note: string|null = (await this.get(appid))?.get(appid) ?? null;

        // Partly copied `ShowConfirmDialog` from shared_global.js
        DOMHelper.insertScript("scriptlets/Store/Common/userNotesModal.js", {
            title: L(__userNote_addForGame, {"gamename": appname}),
            template: this.noteModalTemplate.replace("__note__",
                window.sessionStorage.getItem(`es_note_autosave_${appid}`) ?? note ?? ""),
            strSave: L(__save),
            strCancel: L(__cancel),
            appid: appid
        });

        const oldNote = note;

        note = await (new Promise<string|null>(resolve => {
            // @ts-expect-error
            document.addEventListener("noteClosed",
                (e: CustomEvent<{note: string|null}>) => resolve(e.detail.note),
                {once: true}
            );
        }));
        if (note === null || note === oldNote) { return; }

        if (note.length === 0) {
            this.delete(appid);
            noteEl.textContent = L(__userNote_add);
        } else {
            if (!await this.set(appid, note)) {
                window.sessionStorage.setItem(`es_note_autosave_${appid}`, note);
                return;
            }
            noteEl.textContent = `"${note}"`;
        }

        onNoteUpdate(noteEl, note.length !== 0);
    }

    private async _showOutOfCapacityDialog(exceeded: boolean, ratio: number): Promise<boolean> {

        return new Promise<boolean>(resolve => {

            // @ts-ignore
            document.addEventListener("storageOption", (e: CustomEvent) => {
                const buttonPressed = e.detail;

                if (buttonPressed === "OK") {
                    UserNotesAdapter.changeAdapter("idb")
                        .then(adapter => this._adapter = adapter);

                    Settings.user_notes_adapter = "idb";
                    resolve(true);
                } else {
                    resolve(false);
                }
            });

            const desc
                = `${L(exceeded ? __userNote_notEnoughSpaceDesc : __userNote_closeOnStorageDesc, {perc: (ratio * 100).toFixed(0)})}
                <br>
                ${L(__userNote_storageWarningDesc)}`;

            DOMHelper.insertScript("scriptlets/Store/Common/userNotesOutOfCapacityModal.js", {
                title: L(exceeded ? __userNote_notEnoughSpace : __userNote_closeOnStorage),
                desc: desc,
                strCancel: L(__userNote_saveSyncedStorage),
                strLocalStorage: L(__userNote_saveLocal),
            });
        });
    }
}
