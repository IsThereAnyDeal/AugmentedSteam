import {CallbackFeature} from "modules";

import {ExtensionResources, GameId, HTML, SyncedStorage} from "../../../core_modules";

export default class FCardExchangeLinks extends CallbackFeature {

    checkPrerequisites() {
        return SyncedStorage.get("steamcardexchange");
    }

    callback() {

        const ceImg = ExtensionResources.getURL("img/ico/steamcardexchange.png");

        for (const node of document.querySelectorAll(".badge_row:not(.es-has-ce-link")) {
            const appid = this.context.appid || GameId.getAppidFromGameCard(node.querySelector(".badge_row_overlay").href);
            if (!appid) { continue; }

            HTML.afterBegin(node,
                `<div class="es_steamcardexchange_link">
                    <a href="https://www.steamcardexchange.net/index.php?gamepage-appid-${appid}/" target="_blank" title="Steam Card Exchange">
                        <img src="${ceImg}" alt="Steam Card Exchange">
                    </a>
                </div>`);

            node.classList.add("es-has-ce-link");
        }
    }
}
