import {Feature} from "modules";

import {HTML, HTMLParser, Localization} from "../../../core_modules";
import {ExtensionLayer, RequestData, User} from "common";

export default class FCommonGames extends Feature {

    checkPrerequisites() {
        return User.isSignedIn && document.querySelector("label[for='show_common_games']");
    }

    apply() {

        HTML.afterEnd("label[for='show_common_games']",
            `<label for="es_gl_show_common_games"><input type="checkbox" id="es_gl_show_common_games">${Localization.str.common_label}</label>
             <label for="es_gl_show_notcommon_games"><input type="checkbox" id="es_gl_show_notcommon_games">${Localization.str.notcommon_label}</label>`);

        const commonCheckbox = document.getElementById("es_gl_show_common_games");
        const notCommonCheckbox = document.getElementById("es_gl_show_notcommon_games");
        const rows = document.getElementById("games_list_rows");

        commonCheckbox.addEventListener("change", async({target}) => {
            await this._loadCommonGames();
            rows.classList.toggle("esi-hide-notcommon", target.checked);
            ExtensionLayer.runInPageContext(() => { CScrollOffsetWatcher.ForceRecalc(); }); // eslint-disable-line no-undef, new-cap
        });

        notCommonCheckbox.addEventListener("change", async({target}) => {
            await this._loadCommonGames();
            rows.classList.toggle("esi-hide-common", target.checked);
            ExtensionLayer.runInPageContext(() => { CScrollOffsetWatcher.ForceRecalc(); }); // eslint-disable-line no-undef, new-cap
        });
    }

    async _loadCommonGames() {
        if (this._commonGames !== null) { return; }

        const commonUrl = `${window.location.href}&games_in_common=1`;
        const data = await RequestData.getHttp(commonUrl);

        const games = HTMLParser.getVariableFromText(data, "rgGames", "array");
        this._commonGames = new Set();
        for (const game of games) {
            this._commonGames.add(parseInt(game.appid));
        }

        const nodes = document.querySelectorAll(".gameListRow");
        for (const node of nodes) {
            const appid = parseInt(node.id.split("_")[1]);

            if (this._commonGames.has(appid)) {
                node.classList.add("esi-common");
            } else {
                node.classList.add("esi-notcommon");
            }
        }
    }
}
