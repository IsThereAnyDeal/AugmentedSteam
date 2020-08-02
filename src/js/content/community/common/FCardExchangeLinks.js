import {CallbackFeature} from "modules/CallbackFeature";

import {ExtensionResources, GameId, HTML, SyncedStorage} from "core";

export class FCardExchangeLinks extends CallbackFeature {
    
    checkPrerequisites() {
        return SyncedStorage.get("steamcardexchange");
    }

    apply() {
        super.apply();

        this.callback();
    }

    callback() {

        let ceImg = ExtensionResources.getURL("img/ico/steamcardexchange.png");

        for (let node of document.querySelectorAll(".badge_row:not(.es-has-ce-link")) {
            let appid = this.context.appid || GameId.getAppidFromGameCard(node.querySelector(".badge_row_overlay").href);
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
