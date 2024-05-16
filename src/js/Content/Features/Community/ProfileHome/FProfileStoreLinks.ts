import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import {__visitStore} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";

export default class FProfileStoreLinks extends Feature<CProfileHome> {

    override apply(): void {

        for (const node of document.querySelectorAll<HTMLAnchorElement>(".game_name .whiteLink")) {
            const href = node.href.replace("//steamcommunity.com", "//store.steampowered.com");
            HTML.afterEnd(node, `<br><a class="whiteLink" style="font-size: 10px;" href=${href}>${L(__visitStore)}</a>`);
        }
    }
}
