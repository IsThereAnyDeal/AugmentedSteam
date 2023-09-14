import {Localization, SyncedStorage} from "../../../../modulesCore";
import {Messenger} from "../../../modulesContent";
import {Page} from "../../Page";
import {CapacityInfo, OutOfCapacityError, UserNotesAdapter} from "../../../../Core/Storage/UserNotesAdapter";

class UserNotes {
    constructor() {
        this._str = Localization.str.user_note;
        this._adapter = UserNotesAdapter.getAdapter();

        this.noteModalTemplate
            = `<div class="es_note_prompt newmodal_prompt_with_textarea gray_bevel fullwidth">
                <textarea name="es_note_input" id="es_note_input" rows="6" cols="12">__note__</textarea>
            </div>`;
    }

    get(...args) { return this._adapter.get(...args); }

    async set(...args) {

        let capInfo = null;

        try {
            capInfo = await this._adapter.set(...args);
        } catch (err) {
            if (err instanceof OutOfCapacityError) {
                return (await this._showOutOfCapacityDialog(true, err.ratio)) ? this.set(...args) : false;
            }

            throw err;
        }

        if (capInfo instanceof CapacityInfo && capInfo.closeToFull) {
            await this._showOutOfCapacityDialog(false, capInfo.utilization);
        }

        return true;
    }

    delete(...args) { return this._adapter.delete(...args); }

    async showModalDialog(appname, appid, noteEl, onNoteUpdate) {

        let note = await this.get(appid) || "";

        // Partly copied `ShowConfirmDialog` from shared_global.js
        Page.runInPageContext((title, template, strSave, strCancel, appid) => {
            /* eslint-disable no-undef, new-cap, camelcase */

            const deferred = new jQuery.Deferred();
            function fnOk() {
                deferred.resolve(
                    document.querySelector("#es_note_input").value
                        .trim()
                        .replace(/\s\s+/g, " ")
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

            /**
             * Native keyup handler ignores events on <textarea>s
             * https://github.com/SteamDatabase/SteamTracking/blob/6aabc1d81478c9a3f33598cd0968b5fdaf14f8b8/steamcommunity.com/public/shared/javascript/shared_global.js#L477
             */
            noteInput.addEventListener("keydown", e => {
                if (e.key === "Enter" && !e.shiftKey) {
                    okBtn.trigger("click");
                }
            });

            deferred.promise(modal);

            modal
                .done(note => {
                    window.sessionStorage.removeItem(`es_note_autosave_${appid}`);
                    window.Messenger.postMessage("noteClosed", note);
                })
                .fail(() => {
                    if (noteInput.value.trim() !== "") {
                        window.sessionStorage.setItem(`es_note_autosave_${appid}`, noteInput.value);
                    }
                    window.Messenger.postMessage("noteClosed", null);
                });

            modal.Show();
            /* eslint-enable no-undef, new-cap, camelcase */
        },
        [
            this._str.add_for_game.replace("__gamename__", appname),
            this.noteModalTemplate.replace("__note__", window.sessionStorage.getItem(`es_note_autosave_${appid}`) || note),
            Localization.str.save,
            Localization.str.cancel,
            appid,
        ]);

        const oldNote = note;

        note = await Messenger.onMessage("noteClosed");
        if (note === null || note === oldNote) { return; }

        if (note.length === 0) {
            this.delete(appid);
            noteEl.textContent = this._str.add;
        } else {
            if (!await this.set(appid, note)) {
                window.sessionStorage.setItem(`es_note_autosave_${appid}`, note);
                return;
            }
            noteEl.textContent = `"${note}"`;
        }

        onNoteUpdate(noteEl, note.length !== 0);
    }

    async _showOutOfCapacityDialog(exceeded, ratio) {

        const str = this._str;

        const desc
            = `${(exceeded ? str.not_enough_space_desc : str.close_on_storage_desc).replace("__perc__", (ratio * 100).toFixed(0))}
            <br>
            ${str.storage_warning_desc}`;

        Page.runInPageContext((title, desc, strCloudStorage, strCancel, strLocalStorage) => {
            const modal = window.SteamFacade.showConfirmDialog(title, desc, strLocalStorage, strCancel);

            // Avoid releasing Enter (could be from the previous notes dialog) from auto-confirming selection
            window.SteamFacade.jq(document).off("keyup.SharedConfirmDialog");

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
        let adapterType;

        if (buttonPressed === "OK") {
            adapterType = "idb";
        } else {
            return false;
        }

        this._adapter = await UserNotesAdapter.changeAdapter(adapterType);
        await SyncedStorage.set("user_notes_adapter", adapterType);
        return true;
    }
}

export {UserNotes};
