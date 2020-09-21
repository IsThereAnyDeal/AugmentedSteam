import {ASFeature} from "modules";

import {HTML, HTMLParser, Localization} from "core";
import {ExtensionLayer, RequestData, User} from "common";

export class FCommonGames extends ASFeature {

    checkPrerequisites() {
        return User.isSignedIn && document.querySelector("label[for='show_common_games']");
    }

    apply() {

        HTML.afterEnd("label[for='show_common_games']",
            `<label for="es_gl_show_common_games"><input type="checkbox" id="es_gl_show_common_games">${Localization.str.common_label}</label>
            <label for="es_gl_show_notcommon_games"><input type="checkbox" id="es_gl_show_notcommon_games">${Localization.str.notcommon_label}</label>`);

        let commonCheckbox = document.getElementById("es_gl_show_common_games");
        let notCommonCheckbox = document.getElementById("es_gl_show_notcommon_games");
        let rows = document.getElementById("games_list_rows");

        commonCheckbox.addEventListener("change", async ({target}) => {
            await this._loadCommonGames();
            rows.classList.toggle("esi-hide-notcommon", target.checked);
            ExtensionLayer.runInPageContext(() => { CScrollOffsetWatcher.ForceRecalc(); });
        });

        notCommonCheckbox.addEventListener("change", async ({target}) => {
            await this._loadCommonGames();
            rows.classList.toggle("esi-hide-common", target.checked);
            ExtensionLayer.runInPageContext(() => { CScrollOffsetWatcher.ForceRecalc(); });
        });
    }

    async _loadCommonGames() {
        if (this._commonGames != null) { return; }

        let commonUrl = `${window.location.href}&games_in_common=1`;
        let data = await RequestData.getHttp(commonUrl);

        let games = HTMLParser.getVariableFromText(data, "rgGames", "array");
        this._commonGames = new Set();
        for (let game of games) {
            this._commonGames.add(parseInt(game.appid));
        }

        let nodes = document.querySelectorAll(".gameListRow");
        for (let node of nodes) {
            let appid = parseInt(node.id.split("_")[1]);

            if (this._commonGames.has(appid)) {
                node.classList.add("esi-common");
            } else {
                node.classList.add("esi-notcommon");
            }
        }
    }
}
