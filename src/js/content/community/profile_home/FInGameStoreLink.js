import {ASFeature} from "modules/ASFeature";

import {HTML} from "core";
import {ExtensionLayer} from "common";

export class FInGameStoreLink extends ASFeature {

    checkPrerequisites() {
        const ingameNode = document.querySelector(`input[name="ingameAppID"]`);
        return ingameNode && ingameNode.value;
    }

    apply() {

        const tooltip = Localization.str.view_in_store;
        const node = document.querySelector(".profile_in_game_name");

        HTML.inner(node, `<a data-tooltip-html="${tooltip}" href="//store.steampowered.com/app/${document.querySelector(`input[name="ingameAppID"]`).value}" target="_blank">${node.textContent}</a>`);
        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });
    }
}
