import {__visitStore} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FProfileStoreLinks extends Feature {

    apply() {

        for (const node of document.querySelectorAll(".game_name .whiteLink")) {
            const href = node.href.replace("//steamcommunity.com", "//store.steampowered.com");
            HTML.afterEnd(node, `<br><a class="whiteLink" style="font-size: 10px;" href=${href}>${L(__visitStore)}</a>`);
        }
    }
}
