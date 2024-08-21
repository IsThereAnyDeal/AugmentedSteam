import AppId from "@Core/GameId/AppId";
import {__viewInStore} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import RequestData from "@Content/Modules/RequestData";
import HTML from "@Core/Html/Html";

export default class FInGameStoreLink extends Feature<CProfileHome> {

    private gameNameNode: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        if (this.context.isPrivateProfile) {
            return false;
        }

        this.gameNameNode = document.querySelector<HTMLElement>(".profile_in_game_name");

        return this.gameNameNode !== null
            // Non-Steam game or private
            && this.gameNameNode.textContent!.trim() !== "";
    }

    override async apply(): Promise<void> {

        let appid: number|null = null;

        // Try to get appid from the deprecated "report abuse" form (only appears when logged in)
        const node = document.querySelector<HTMLInputElement>("input[name=ingameAppID]");
        if (node) {
            appid = Number(node.value);
        } else {
            // Otherwise fetch the profile's miniprofile data
            const node = document.querySelector<HTMLElement>("[data-miniprofile]");
            if (!node) {
                throw new Error("Node with miniprofile data not found");
            }

            const data = await RequestData.getJson<{
                in_game?: {
                    name: string, // Might be empty
                    is_non_steam: boolean,
                    logo?: string,
                }
            }>(`https://steamcommunity.com/miniprofile/${node.dataset.miniprofile}/json/`, {credentials: "omit"});

            if (data.in_game?.logo) {
                appid = AppId.fromCDNUrl(data.in_game.logo);
            }
        }

        if (!appid) { return; }

        // Find the text node and replace it to avoid removing the `.private_app_indicator` image
        for (const n of this.gameNameNode!.childNodes) {
            if (n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== "") {

                HTML.beforeEnd(this.gameNameNode!,
                    `<a href="//store.steampowered.com/app/${appid}/" target="_blank">
                        <span data-tooltip-text="${L(__viewInStore)}">${n.textContent}</span>
                    </a>`);

                n.remove();

                break;
            }
        }
    }
}
