import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Clipboard, Feature, SteamIdDetail} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FViewSteamId extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("profile_steamid");
    }

    apply() {

        const dropdown = document.querySelector("#profile_action_dropdown .popup_body.popup_menu");
        if (dropdown) {
            HTML.beforeEnd(dropdown,
                `<a class="popup_menu_item" id="es_steamid">
                    <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/iconForums.png">&nbsp; ${Localization.str.view_steamid}
                </a>`);
        } else {
            const actions = document.querySelector(".profile_header_actions");
            if (actions) {
                HTML.beforeEnd(actions,
                    `<a class="btn_profile_action btn_medium" id="es_steamid">
                        <span>${Localization.str.view_steamid}</span>
                    </a>`);
            }
        }

        document.querySelector("#es_steamid").addEventListener("click", () => { this._showSteamIdDialog(); });
    }

    _showSteamIdDialog() {

        async function copySteamId(e) {
            const elem = e.target.closest(".es-copy");
            if (!elem) { return; }

            const result = await Clipboard.set(elem.querySelector(".es-copy__id").textContent);
            if (!result) { return; }

            elem.addEventListener("transitionend", () => {
                elem.classList.remove("is-copied");
            }, {"once": true});

            elem.classList.add("is-copied");
        }

        document.addEventListener("click", copySteamId);

        const imgUrl = ExtensionResources.getURL("img/clippy.svg");

        const steamId = new SteamIdDetail(this.context.steamId);
        const ids = [
            steamId.id2,
            steamId.id3,
            steamId.id64,
            steamId.id64hex,
            `https://steamcommunity.com/profiles/${steamId.id64}`
        ];

        let html = "";
        for (const id of ids) {
            if (!id) { continue; }
            html += `<p>
                        <a class="es-copy">
                            <span class="es-copy__id">${id}</span>
                            <img src="${imgUrl}" class="es-copy__icon">
                            <span class="es-copy__copied">${Localization.str.copied}</span>
                        </a>
                    </p>`;
        }

        Page.runInPageContext((steamidOfUser, html, close) => {
            const f = window.SteamFacade;
            f.hideMenu("profile_action_dropdown_link", "profile_action_dropdown");

            const dialog = f.showAlertDialog(
                steamidOfUser.replace("__user__", f.global("g_rgProfileData").personaname),
                html,
                close
            );

            return new Promise(resolve => {
                dialog.done(() => { resolve(); });
            });
        },
        [
            Localization.str.steamid_of_user,
            html,
            Localization.str.close,
        ],
        "closeDialog")
            .then(() => { document.removeEventListener("click", copySteamId); });
    }
}
