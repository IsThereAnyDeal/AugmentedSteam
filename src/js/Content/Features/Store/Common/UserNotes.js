import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Messenger} from "../../../modulesContent";
import {Page} from "../../Page";

export class UserNotes {
    constructor() {

        this._notes = SyncedStorage.get("user_notes") || {};
        this._str = Localization.str.user_note;

        this.noteModalTemplate
            = `<div class="es_note_prompt newmodal_prompt_with_textarea gray_bevel fullwidth">
                <textarea name="es_note_input" id="es_note_input" rows="6" cols="12" maxlength="512">__note__</textarea>
            </div>`;
    }

    // TODO data functions should probably be split from presentation, but splitting it to background seems unneccessary
    get(appid) {
        return this._notes[appid];
    }

    set(appid, note) {

        const oldNote = this._notes[appid];
        this._notes[appid] = note;

        const storageUsage = this._getNotesSize() / SyncedStorage.QUOTA_BYTES_PER_ITEM;
        if (storageUsage > 1) {
            this._notes[appid] = oldNote;
            this._showCloudStorageDialog(true, storageUsage);
            return false;
        }

        SyncedStorage.set("user_notes", this._notes);

        if (storageUsage > 0.85) {
            this._showCloudStorageDialog(false, storageUsage);
        }

        return true;
    }

    delete(appid) {
        delete this._notes[appid];
        SyncedStorage.set("user_notes", this._notes);
    }

    exists(appid) {
        return Boolean(this._notes[appid]);
    }

    async showModalDialog(appname, appid, nodeSelector, onNoteUpdate) {

        // Partly copied from shared_global.js
        Page.runInPageContext((title, template, strSave, strCancel) => {
            /* eslint-disable no-undef, new-cap, camelcase */

            const deferred = new jQuery.Deferred();
            function fnOk() {
                deferred.resolve(
                    document.querySelector("#es_note_input").value
                        .trim()
                        .replace(/\s\s+/g, " ")
                        .substring(0, 512)
                );
            }

            function fnCancel() {
                deferred.reject();
            }

            const buttons = [];

            const okBtn = _BuildDialogButton(strSave, true);
            okBtn.click(fnOk);
            buttons.push(okBtn);

            const cancelBtn = _BuildDialogButton(strCancel, false);
            cancelBtn.click(fnCancel);
            buttons.push(cancelBtn);

            const modal = _BuildDialog(title, template, buttons, fnCancel);

            _BindOnEnterKeyPressForDialog(modal, deferred, fnOk);
            deferred.always(() => modal.Dismiss());

            const noteInput = document.getElementById("es_note_input");
            noteInput.focus();
            noteInput.setSelectionRange(0, noteInput.textLength);

            deferred.promise(modal);

            modal
                .done(note => {
                    window.Messenger.postMessage("noteClosed", note);
                })
                .fail(() => {
                    window.Messenger.postMessage("noteClosed", null);
                });

            modal.Show();
            /* eslint-enable no-undef */
        },
        [
            this._str.add_for_game.replace("__gamename__", appname),
            this.noteModalTemplate.replace("__appid__", appid).replace("__note__", this.get(appid) || "")
                .replace("__selector__", encodeURIComponent(nodeSelector)),
            Localization.str.save,
            Localization.str.cancel,
        ],
        true);

        const note = await Messenger.onMessage("noteClosed");
        if (note === null) { return; }

        const _note = HTML.escape(note);
        if (_note === (this.get(appid) || "")) { return; }

        const node = document.querySelector(nodeSelector);

        if (_note.length === 0) {
            this.delete(appid);
            node.textContent = this._str.add;
        } else {
            const success = this.set(appid, note);
            if (!success) { return; }
            HTML.inner(node, `"${note}"`);
        }

        onNoteUpdate(node, _note.length !== 0);
    }

    async _showCloudStorageDialog(exceeded, perc) {

        const str = this._str;

        const desc
            = `${(exceeded ? str.not_enough_space_desc : str.close_on_storage_desc).replace("__perc__", (perc * 100).toFixed(0))}
            <br>
            ${str.storage_warning_desc}`;

        await Page.runInPageContext((title, desc, strCloudStorage, strCancel, strLocalStorage) => {
            window.SteamFacade.showConfirmDialog(title, desc, strCloudStorage, strCancel, strLocalStorage);
        },
        [
            exceeded ? str.not_enough_space : str.close_on_storage,
            desc,
            str.save_itad,
            str.save_synced_storage,
            str.save_local,
        ],
        true);
    }

    _getNotesSize() {
        return "user_notes".length + JSON.stringify(this._notes).length;
    }
}
