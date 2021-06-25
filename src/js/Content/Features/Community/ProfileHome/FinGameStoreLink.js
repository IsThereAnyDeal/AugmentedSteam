import {HTML, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

export default class FInGameStoreLink extends Feature {

    checkPrerequisites() {
        return !this.context.isPrivateProfile && User.isSignedIn;
    }

    apply() {

        // The input needed to get appid only appears when logged in
        const ingameNode = document.querySelector("input[name=ingameAppID]");
        if (!ingameNode || !ingameNode.value) { return; }

        const node = document.querySelector(".profile_in_game_name:not(.es_shared_by");

        HTML.inner(node,
            `<a href="//store.steampowered.com/app/${ingameNode.value}" target="_blank">
                <span data-tooltip-text="${Localization.str.view_in_store}">${node.textContent}</span>
            </a>`);
    }
}
