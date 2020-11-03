import {Feature} from "../../../Modules/Content/Feature/Feature";
import {HTML, Localization} from "../../../modulesCore";

export default class FProfileStoreLinks extends Feature {

    apply() {

        for (const node of document.querySelectorAll(".game_name .whiteLink")) {
            const href = node.href.replace("//steamcommunity.com", "//store.steampowered.com");
            HTML.afterEnd(node, `<br><a class="whiteLink" style="font-size: 10px;" href=${href}>${Localization.str.visit_store}</a>`);
        }
    }
}
