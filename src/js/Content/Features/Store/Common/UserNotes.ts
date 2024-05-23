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
    __userNote_saveItad,
    __userNote_saveLocal,
    __userNote_saveSyncedStorage,
    __userNote_storageWarningDesc,
} from "@Strings/_strings";
import type AdapterInterface from "@Content/Modules/UserNotes/Adapters/AdapterInterface";
import DOMHelper from "@Content/Modules/DOMHelper";
import Settings from "@Options/Data/Settings";

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

    async set(appid: number, note: string): Promise<boolean> {
        let capInfo = null;

        try {
            capInfo = await this._adapter.set(appid, note);
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

    delete(appid: number): Promise<void> {
        return this._adapter.delete(appid);
    }

    async showModalDialog(
        appname: string,
        appid: number,
        noteEl: HTMLElement,
        onNoteUpdate: (noteEl: HTMLElement, hasNote: boolean) => void
    ): Promise<void> {

        let note: string = (await this.get(appid))?.get(appid) ?? "";

        // Partly copied `ShowConfirmDialog` from shared_global.js
        DOMHelper.insertScript("scriptlets/Store/Common/userNotesModal.js", {
            title: L(__userNote_addForGame, {"gamename": appname}),
            template: this.noteModalTemplate.replace("__note__",
                window.sessionStorage.getItem(`es_note_autosave_${appid}`) ?? note),
            strSave: L(__save),
            strCancel: L(__cancel),
            appid: appid
        });

        const oldNote = note;

        note = await Messenger.onMessage("noteClosed");
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
                strCloudStorage: L(__userNote_saveItad),
                strCancel: L(__userNote_saveSyncedStorage),
                strLocalStorage: L(__userNote_saveLocal),
            });
        });
    }
}
