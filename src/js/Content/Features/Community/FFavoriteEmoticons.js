import {HTML, Localization, SyncedStorage} from "../../../modulesCore";
import {Feature} from "../../modulesContent";

export default class FFavoriteEmoticons extends Feature {

    checkPrerequisites() {
        return document.querySelector(".emoticon_button") !== null;
    }

    apply() {
        new MutationObserver(() => { this._emoticonPopupHandler(); })
            .observe(document.body, {"childList": true});
    }

    _emoticonPopupHandler() {
        const emoticonPopup = document.querySelector(".emoticon_popup:not(.es_emoticons)");
        if (!emoticonPopup) { return; }

        emoticonPopup.classList.add("es_emoticons");

        for (const node of emoticonPopup.querySelectorAll(".emoticon_option")) {
            node.draggable = true;
            node.querySelector("img").draggable = false;
            node.addEventListener("dragstart", (ev) => this._dragFavEmoticon(ev));
        }

        HTML.afterBegin(emoticonPopup,
            `<div class="emoticon_popup_content es_emoticons_content">
                <div class="commentthread_entry_quotebox" id="es_fav_remove"></div>
                <div class="commentthread_entry_quotebox" id="es_fav_emoticons"></div>
            </div>`);

        const favBox = emoticonPopup.querySelector("#es_fav_emoticons");
        const favRemove = emoticonPopup.querySelector("#es_fav_remove");
        let favs = SyncedStorage.get("fav_emoticons");
        this._updateFavs(favs, emoticonPopup, favBox);

        favBox.addEventListener("dragover", ev => {
            ev.preventDefault();
            favBox.style.backgroundColor = "black";
        });

        favBox.addEventListener("dragenter", () => {
            favBox.style.backgroundColor = "black";
        });

        favBox.addEventListener("dragleave", ev => {
            // Additional check to avoid background flicker when hovering over child elements, see https://stackoverflow.com/a/54960084
            if (!favBox.contains(ev.relatedTarget)) {
                favBox.style.backgroundColor = null;
            }
        });

        favBox.addEventListener("drop", ev => {
            ev.preventDefault();

            favBox.style.backgroundColor = null;
            const name = ev.dataTransfer.getData("emoticon");
            if (favs.includes(name)) { return; }

            favs.push(name);
            this._updateFavs(favs, emoticonPopup, favBox, name);
        });

        favRemove.addEventListener("dragover", ev => {
            ev.preventDefault();
            favRemove.style.backgroundColor = "black";
        });

        favRemove.addEventListener("dragenter", () => {
            favRemove.style.backgroundColor = "black";
        });

        favRemove.addEventListener("dragleave", () => {
            favRemove.style.backgroundColor = null;
        });

        favRemove.addEventListener("drop", ev => {
            ev.preventDefault();

            favRemove.style.backgroundColor = null;
            const name = ev.dataTransfer.getData("emoticon");
            favs = favs.filter(fav => fav !== name);
            this._updateFavs(favs, emoticonPopup, favBox, name);
        });
    }

    _updateFavs(favs, emoticonPopup, favBox, name) {
        SyncedStorage.set("fav_emoticons", favs);

        if (name && favs.includes(name) && favs.length > 1) {
            HTML.beforeEnd(favBox, this._buildEmoticonOption(name));
            const node = favBox.querySelector(`[data-emoticon="${name}"]`);
            this._finalizeFav(node, emoticonPopup);
        } else if (name && !favs.includes(name) && favs.length > 0) {
            const node = favBox.querySelector(`[data-emoticon="${name}"]`);
            if (!node) { return; }
            node.remove();
        } else {
            const favsHtml = this._buildFavBox(favs);
            HTML.inner(favBox, favsHtml);
            for (const node of favBox.querySelectorAll(".emoticon_option")) {
                this._finalizeFav(node, emoticonPopup);
            }
        }
    }

    _finalizeFav(node, emoticonPopup) {
        node.draggable = true;
        node.querySelector("img").draggable = false;
        node.addEventListener("dragstart", (ev) => this._dragFavEmoticon(ev));
        node.addEventListener("click", (ev) => this._clickFavEmoticon(ev, emoticonPopup));
    }

    _dragFavEmoticon(ev) {
        ev.dataTransfer.setData("emoticon", ev.target.dataset.emoticon);
        const emoticonHover = document.querySelector(".emoticon_hover");
        if (emoticonHover) {
            emoticonHover.style.display = "none";
        }
    }

    _clickFavEmoticon(ev, emoticonPopup) {
        const node = ev.target.closest(".emoticon_option");
        const noFav = emoticonPopup.querySelector(`[data-emoticon=${node.dataset.emoticon}]:not(.es_fav)`);
        if (!noFav) {
            // The user doesn't have access to this emoticon
            ev.stopPropagation();
            node.classList.add("no-access");
            node.querySelector("img").title = Localization.str.fav_emoticons_no_access;
            return;
        }
        noFav.click();
    }

    _buildFavBox(favs = []) {
        let favsHtml;
        if (favs.length) {
            favsHtml = favs.map(fav => this._buildEmoticonOption(fav)).join("");
        } else {
            favsHtml = Localization.str.fav_emoticons_dragging;
        }
        return favsHtml;
    }

    _buildEmoticonOption(name) {
        return `<div class="emoticon_option es_fav" data-emoticon="${name}"><img src="//community.cloudflare.steamstatic.com/economy/emoticon/${name}" class="emoticon"></div>`;
    }
}
