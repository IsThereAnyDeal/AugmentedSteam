import {HTML, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FInGameStoreLink extends Feature {

    checkPrerequisites() {
        return !this.context.isPrivateProfile && User.isSignedIn;
    }

    apply() {

        // The input needed to get appid only appears when logged in
        const ingameNode = document.querySelector("input[name=ingameAppID]");
        if (!ingameNode || !ingameNode.value) { return; }

        const node = document.querySelector(".profile_in_game_name");

        HTML.inner(node, `<a data-tooltip-html="${Localization.str.view_in_store}" href="//store.steampowered.com/app/${ingameNode.value}" target="_blank">${node.textContent}</a>`);

        Page.runInPageContext(() => { window.SteamFacade.setupTooltips(); });
    }
}
