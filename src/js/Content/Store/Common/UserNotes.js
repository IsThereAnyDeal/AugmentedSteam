import {HTML, Localization, SyncedStorage} from "../../../core_modules";
import {Messenger} from "../../../Modules/Content";
import {Page} from "../../Page";

export class UserNotes {
    constructor() {

        this._notes = SyncedStorage.get("user_notes") || {};

        this.noteModalTemplate = `
            <div id="es_note_modal" data-appid="__appid__" data-selector="__selector__">
                <div id="es_note_modal_content">
                    <div class="es_note_prompt newmodal_prompt_with_textarea gray_bevel fullwidth">
                        <textarea name="es_note_input" id="es_note_input" rows="6" cols="12" maxlength="512">__note__</textarea>
                    </div>
                    <div class="es_note_buttons" style="float: right">
                        <div class="es_note_modal_submit btn_green_white_innerfade btn_medium">
                            <span>${Localization.str.save}</span>
                        </div>
                        <div class="es_note_modal_close btn_grey_white_innerfade btn_medium">
                            <span>${Localization.str.cancel}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // TODO data functions should probably be split from presentation, but splitting it to background seems unneccessary
    get(appid) {
        return this._notes[appid];
    }

    set(appid, note) {
        this._notes[appid] = note;
        SyncedStorage.set("user_notes", this._notes);
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
        const bgClick = Page.runInPageContext((title, template) => {
            /* eslint-disable no-undef, new-cap, camelcase */
            const deferred = new jQuery.Deferred();
            function fnOk() { deferred.resolve(); }

            const Modal = _BuildDialog(title, template, [], fnOk);
            deferred.always(() => Modal.Dismiss());

            const promise = new Promise(resolve => {
                Modal.m_fnBackgroundClick = () => {
                    Messenger.onMessage("noteSaved").then(() => { Modal.Dismiss(); });
                    resolve();
                };
            });

            Modal.Show();

            // attach the deferred's events to the modal
            deferred.promise(Modal);

            const note_input = document.getElementById("es_note_input");
            note_input.focus();
            note_input.setSelectionRange(0, note_input.textLength);
            note_input.addEventListener("keydown", e => {
                if (e.key === "Enter") {
                    $J(".es_note_modal_submit").click();
                } else if (e.key === "Escape") {
                    Modal.Dismiss();
                }
            });

            return promise;
            /* eslint-enable no-undef */
        },
        [
            Localization.str.user_note.add_for_game.replace("__gamename__", appname),
            this.noteModalTemplate.replace("__appid__", appid).replace("__note__", await this.get(appid) || "")
                .replace("__selector__", encodeURIComponent(nodeSelector)),
        ],
        "backgroundClick");

        const saveNote = () => {
            const modal = document.querySelector("#es_note_modal");
            const appid = parseInt(modal.dataset.appid);
            const note = HTML.escape(modal.querySelector("#es_note_input").value.trim().replace(/\s\s+/g, " ")
                .substring(0, 512));
            const node = document.querySelector(decodeURIComponent(modal.dataset.selector));

            if (note.length === 0) {
                this.delete(appid);
                node.textContent = Localization.str.user_note.add;
                return [node, false];
            }

            this.set(appid, note);
            HTML.inner(node, `"${note}"`);
            return [node, true];
        };

        function clickListener(e) {
            if (e.target.closest(".es_note_modal_submit")) {
                e.preventDefault();
                onNoteUpdate(...saveNote());
                Page.runInPageContext(() => { window.SteamFacade.dismissActiveModal(); });
            } else if (e.target.closest(".es_note_modal_close")) {
                Page.runInPageContext(() => { window.SteamFacade.dismissActiveModal(); });
            } else {
                return;
            }
            document.removeEventListener("click", clickListener);
        }

        document.addEventListener("click", clickListener);

        bgClick.then(() => {
            onNoteUpdate(...saveNote());
            Messenger.postMessage("noteSaved");
        });
    }
}
