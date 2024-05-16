import {__close, __copied, __steamidOfUser, __viewSteamid} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import ExtensionResources from "@Core/ExtensionResources";
import {SteamIdDetail} from "@Content/Modules/SteamId";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import Clipboard from "@Content/Modules/Clipboard";

export default class FViewSteamId extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        return Settings.profile_steamid && this.context.steamId !== null;
    }

    override apply(): void {

        const dropdown = document.querySelector("#profile_action_dropdown .popup_body.popup_menu");
        if (dropdown) {
            HTML.beforeEnd(dropdown,
                `<a class="popup_menu_item" id="es_steamid">
                    <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/iconForums.png">&nbsp; ${L(__viewSteamid)}
                </a>`);
        } else {
            const actions = document.querySelector(".profile_header_actions");
            if (actions) {
                HTML.beforeEnd(actions,
                    `<a class="btn_profile_action btn_medium" id="es_steamid">
                        <span>${L(__viewSteamid)}</span>
                    </a>`);
            }
        }

        document.querySelector("#es_steamid")!
            .addEventListener("click", () => this._showSteamIdDialog());
    }

    private async _showSteamIdDialog(): Promise<void> {

        async function copySteamId(e: MouseEvent) {
            const elem = (<HTMLElement>(e.target)).closest(".es-copy");
            if (!elem) { return; }

            const result = await Clipboard.set(elem.querySelector<HTMLElement>(".es-copy__id")!.textContent!);
            if (!result) { return; }

            elem.addEventListener("transitionend", () => {
                elem.classList.remove("is-copied");
            }, {"once": true});

            elem.classList.add("is-copied");
        }

        document.addEventListener("click", copySteamId);

        const imgUrl = ExtensionResources.getURL("img/clippy.svg");

        const steamId = new SteamIdDetail(this.context.steamId!);
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
                            <span class="es-copy__copied">${L(__copied)}</span>
                        </a>
                    </p>`;
        }


        SteamFacade.hideMenu("profile_action_dropdown_link", "profile_action_dropdown");
        await SteamFacade.showAlertDialog(
            L(__steamidOfUser).replace("__user__", (await SteamFacade.global("g_rgProfileData")).personaname),
            html,
            L(__close)
        );
        document.removeEventListener("click", copySteamId);
    }
}
