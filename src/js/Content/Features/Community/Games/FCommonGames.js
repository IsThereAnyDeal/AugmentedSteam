import {HTML, HTMLParser, Localization} from "../../../../modulesCore";
import {Feature, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FCommonGames extends Feature {

    checkPrerequisites() {
        // Steam's filter checkbox won't appear if not signed in, or if on own profile
        return document.querySelector(".common_filter_ctn") !== null;
    }

    apply() {

        document.getElementById("gameslist_controls").classList.add("as_flyout_menus");

        HTML.afterEnd(".common_filter_ctn",
            `<div class="es_games_filter">
                <span>${Localization.str.show}</span>
                <div class="store_nav">
                    <div class="tab flyout_tab" data-flyout="es_filter_flyout" data-flyout-align="left" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_filter_active">${Localization.str.games_all}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
                <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_filter_flyout">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item" id="es_games_all">${Localization.str.games_all}</a>
                        <a class="popup_menu_item" id="es_games_common">${Localization.str.games_common}</a>
                        <a class="popup_menu_item" id="es_games_notcommon">${Localization.str.games_notcommon}</a>
                    </div>
                </div>
            </div>`);

        Page.runInPageContext(() => { window.SteamFacade.bindAutoFlyoutEvents(); });

        const rows = document.getElementById("games_list_rows");

        document.getElementById("es_games_all").addEventListener("click", () => {
            rows.classList.remove("esi-hide-common", "esi-hide-notcommon");
            document.getElementById("es_filter_active").textContent = Localization.str.games_all;
            document.getElementById("es_filter_flyout").style.display = "none";
        });

        document.getElementById("es_games_common").addEventListener("click", async() => {
            await this._loadCommonGames();

            rows.classList.remove("esi-hide-common");
            rows.classList.add("esi-hide-notcommon");
            document.getElementById("es_filter_active").textContent = Localization.str.games_common;
            document.getElementById("es_filter_flyout").style.display = "none";

            Page.runInPageContext(() => { window.SteamFacade.scrollOffsetForceRecalc(); });
        });

        document.getElementById("es_games_notcommon").addEventListener("click", async() => {
            await this._loadCommonGames();

            rows.classList.remove("esi-hide-notcommon");
            rows.classList.add("esi-hide-common");
            document.getElementById("es_filter_active").textContent = Localization.str.games_notcommon;
            document.getElementById("es_filter_flyout").style.display = "none";

            Page.runInPageContext(() => { window.SteamFacade.scrollOffsetForceRecalc(); });
        });
    }

    async _loadCommonGames() {
        if (this._hasCommonGamesLoaded) { return; }
        this._hasCommonGamesLoaded = true;

        const commonUrl = `${window.location.href}&games_in_common=1`;
        const data = await RequestData.getHttp(commonUrl);

        const games = HTMLParser.getVariableFromText(data, "rgGames", "array");
        const _commonGames = new Set();
        for (const game of games) {
            _commonGames.add(parseInt(game.appid));
        }

        const nodes = document.querySelectorAll(".gameListRow");
        for (const node of nodes) {
            const appid = parseInt(node.id.split("_")[1]);

            if (_commonGames.has(appid)) {
                node.classList.add("esi-common");
            } else {
                node.classList.add("esi-notcommon");
            }
        }
    }
}
