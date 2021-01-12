import {ExtensionResources, HTML, Localization, SyncedStorage, TimeUtils} from "../../../../modulesCore";
import {Clipboard, Feature, SteamId, SteamIdDetail} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FViewSteamId extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("profile_steamid");
    }

    apply() {

        async function copySteamId(e) {
            const elem = e.target.closest(".es-copy");
            if (!elem) { return; }

            Clipboard.set(elem.querySelector(".es-copy__id").innerText);

            const lastCopied = document.querySelector(".es-copy.is-copied");
            if (lastCopied) {
                lastCopied.classList.remove("is-copied");
            }

            elem.classList.add("is-copied");
            await TimeUtils.timer(2000);
            elem.classList.remove("is-copied");
        }

        function showSteamIdDialog() {
            document.addEventListener("click", copySteamId);

            const imgUrl = ExtensionResources.getURL("img/clippy.svg");

            const steamId = new SteamIdDetail(SteamId.getSteamId());
            const ids = [
                steamId.id2,
                steamId.id3,
                steamId.id64,
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

        const dropdown = document.querySelector("#profile_action_dropdown .popup_body.popup_menu");
        if (dropdown) {
            HTML.beforeEnd(dropdown,
                `<a class="popup_menu_item" id="es_steamid">
                    <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/iconForums.png">&nbsp; ${Localization.str.view_steamid}
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

        document.querySelector("#es_steamid").addEventListener("click", showSteamIdDialog);
    }
}
