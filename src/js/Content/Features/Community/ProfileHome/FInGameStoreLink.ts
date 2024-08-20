import AppId from "@Core/GameId/AppId";
import {__viewInStore} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import RequestData from "@Content/Modules/RequestData";
import HTML from "@Core/Html/Html";

export default class FInGameStoreLink extends Feature<CProfileHome> {

    private _avatarNode: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        if (this.context.isPrivateProfile) {
            return false;
        }

        this._avatarNode = document.querySelector<HTMLElement>(".profile_header_size[data-miniprofile]");

        return this._avatarNode !== null
            && this._avatarNode.classList.contains("in-game");
    }

    override async apply(): Promise<void> {

        // Try to get appid from the deprecated "report abuse" form (only appears when logged in)
        let appid: string|number|null = document.querySelector<HTMLInputElement>("input[name=ingameAppID]")?.value ?? null;

        // Otherwise fetch the profile's miniprofile hover content
        if (!appid) {
            const html = await RequestData.getText(`https://steamcommunity.com/miniprofile/${this._avatarNode!.dataset.miniprofile}`);
            const doc = HTML.toDom(html);
            appid = AppId.fromImageElement(doc.querySelector("img.game_logo"));
            if (!appid) { return; }
        }

        const node = document.querySelector<HTMLElement>(".profile_in_game_name");
        if (!node) {
            return;
        }

        // Find the text node and replace it to avoid removing the `.private_app_indicator` image
        for (const n of node.childNodes) {
            if (n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== "") {

                HTML.beforeEnd(node,
                    `<a href="//store.steampowered.com/app/${appid}" target="_blank">
                        <span data-tooltip-text="${L(__viewInStore)}">${n.textContent}</span>
                    </a>`);

                n.remove();

                break;
            }
        }
    }
}
