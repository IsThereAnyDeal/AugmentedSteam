import {__viewInStore} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {GameId, HTML} from "../../../../modulesCore";
import {Feature, RequestData} from "../../../modulesContent";

export default class FInGameStoreLink extends Feature {

    checkPrerequisites() {
        return !this.context.isPrivateProfile
            && (this._avatarNode = document.querySelector(".profile_header_size[data-miniprofile]")) !== null
            && this._avatarNode.classList.contains("in-game");
    }

    async apply() {

        // Try to get appid from the deprecated "report abuse" form (only appears when logged in)
        let appid = document.querySelector("input[name=ingameAppID]")?.value;

        // Otherwise fetch the profile's miniprofile hover content
        if (!appid) {
            const html = await RequestData.getHttp(`https://steamcommunity.com/miniprofile/${this._avatarNode.dataset.miniprofile}`);
            const doc = HTML.toDom(html);
            appid = GameId.getAppidImgSrc(doc.querySelector("img.game_logo"));
            if (!appid) { return; }
        }

        const node = document.querySelector(".profile_in_game_name");

        HTML.inner(node,
            `<a href="//store.steampowered.com/app/${appid}" target="_blank">
                <span data-tooltip-text="${L(__viewInStore)}">${node.textContent}</span>
            </a>`);
    }
}
