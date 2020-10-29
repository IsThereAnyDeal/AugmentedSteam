import {HTML, Localization} from "../../../core_modules";
import {Feature} from "../../../Modules/content";
import {Page} from "../../Page";

export default class FInGameStoreLink extends Feature {

    checkPrerequisites() {
        const ingameNode = document.querySelector('input[name="ingameAppID"]');
        return ingameNode && ingameNode.value;
    }

    apply() {

        const tooltip = Localization.str.view_in_store;
        const node = document.querySelector(".profile_in_game_name");

        HTML.inner(node, `<a data-tooltip-html="${tooltip}" href="//store.steampowered.com/app/${document.querySelector('input[name="ingameAppID"]').value}" target="_blank">${node.textContent}</a>`);
        // eslint-disable-next-line new-cap, no-undef
        Page.runInPageContext(() => { SetupTooltips({"tooltipCSSClass": "community_tooltip"}); });
    }
}
