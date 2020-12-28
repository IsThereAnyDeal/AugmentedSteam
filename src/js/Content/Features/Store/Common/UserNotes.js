import {HTML, Localization} from "../../../../modulesCore";
import {Messenger} from "../../../modulesContent";
import {Page} from "../../Page";
import {UserNotesAdapter} from "./UserNotesAdapter";

class UserNotes {
    constructor() {
        this._str = Localization.str.user_note;
        this._adapter = UserNotesAdapter.adapter;

        this.noteModalTemplate
            = `<div class="es_note_prompt newmodal_prompt_with_textarea gray_bevel fullwidth">
                <textarea name="es_note_input" id="es_note_input" rows="6" cols="12" maxlength="512">__note__</textarea>
            </div>`;
    }

    get(...args) { return this._adapter.get(...args); }
    set(...args) { return this._adapter.set(...args); }
    delete(...args) { return this._adapter.delete(...args); }

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
                .done(note => { window.Messenger.postMessage("noteClosed", note); })
                .fail(() => { window.Messenger.postMessage("noteClosed", null); });

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

        Page.runInPageContext((title, desc, strCloudStorage, strCancel, strLocalStorage) => {
            const modal = window.SteamFacade.showConfirmDialog(title, desc, strCloudStorage, strCancel, strLocalStorage);

            modal
                .done(res => window.Messenger.postMessage("storageOption", res))
                .fail(() => window.Messenger.postMessage("storageOption", null));
        },
        [
            exceeded ? str.not_enough_space : str.close_on_storage,
            desc,
            str.save_itad,
            str.save_synced_storage,
            str.save_local,
        ]);

        const buttonPressed = await Messenger.onMessage("storageOption");

        if (buttonPressed === "OK") {
            this._adapter = await UserNotesAdapter.changeAdapter("itad");
        } else if (buttonPressed === "SECONDARY") {
            this._adapter = await UserNotesAdapter.changeAdapter("idb");
        }
    }
}

export {UserNotes};
