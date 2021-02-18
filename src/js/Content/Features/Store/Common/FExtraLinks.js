import {HTML, HTMLParser, Localization, SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";

export default class FExtraLinks extends Feature {

    checkPrerequisites() {
        const context = this.context;

        if (context.type === ContextType.APP) {
            this._type = "app";
            this._gameid = context.appid;
            this._node = document.querySelector("#ReportAppBtn").parentNode;
        } else if (context.type === ContextType.SUB) {
            this._type = "sub";
            this._gameid = context.subid;
            this._node = document.querySelector(".share").parentNode;
        } else if (context.type === ContextType.BUNDLE) {
            this._type = "bundle";
            this._gameid = context.bundleid;
            this._node = document.querySelector(".share, .rightcol .game_details");
        }

        if (!this._node) {
            console.warn("Couldn't find element to insert extra links");
        }

        return this._node !== null && (

            // Even if the user doesn't want to see any extra links, they may want to change the placement of native links (see _moveExtraLinks)
            this._type === "app"

            // Preferences for links shown on all pages
            || (SyncedStorage.get("showbartervg")
            || SyncedStorage.get("showsteamdb")
            || SyncedStorage.get("showitadlinks"))
        );
    }

    apply() {

        if (this._type === "app") {

            this._moveExtraLinks();

            const appName = HTMLParser.clearSpecialSymbols(this.context.appName);

            if (SyncedStorage.get("showyoutube")) {
                HTML.afterBegin(this._node,
                    this._getRightColLinkHtml(
                        "youtube_btn",
                        `https://www.youtube.com/results?search_query=${encodeURIComponent(appName)}`,
                        Localization.str.view_on_website.replace("__website__", "YouTube")
                    ));
            }

            if (SyncedStorage.get("showtwitch")) {
                HTML.afterBegin(this._node,
                    this._getRightColLinkHtml(
                        "twitch_btn",
                        `https://www.twitch.tv/directory/game/${encodeURIComponent(appName)}`,
                        Localization.str.view_on_website.replace("__website__", "Twitch")
                    ));
            }

            if (SyncedStorage.get("showpcgw")) {
                HTML.afterBegin(this._node,
                    this._getRightColLinkHtml(
                        "pcgw_btn",
                        `https://pcgamingwiki.com/api/appid.php?appid=${this.context.appid}`,
                        Localization.str.wiki_article.replace("__pcgw__", "PCGamingWiki")
                    ));
            }

            if (SyncedStorage.get("showcompletionistme")) {
                HTML.afterBegin(this._node,
                    this._getRightColLinkHtml(
                        "completionistme_btn",
                        `https://completionist.me/steam/app/${this.context.appid}/`,
                        Localization.str.view_on_website.replace("__website__", "Completionist.me")
                    ));
            }

            if (SyncedStorage.get("showprotondb")) {
                HTML.afterBegin(this._node,
                    this._getRightColLinkHtml(
                        "protondb_btn",
                        `https://www.protondb.com/app/${this.context.appid}/`,
                        Localization.str.view_on_website.replace("__website__", "ProtonDB")
                    ));
            }

            if (this.context.hasCards && SyncedStorage.get("showsteamcardexchange")) {

                // FIXME some dlc have card category yet no card
                HTML.afterBegin(this._node,
                    this._getRightColLinkHtml(
                        "cardexchange_btn",
                        `https://www.steamcardexchange.net/index.php?gamepage-appid-${this.context.communityAppid}/`,
                        Localization.str.view_on_website.replace("__website__", "Steam Card Exchange")
                    ));
            }
        }

        if (SyncedStorage.get("showbartervg")) {
            HTML.afterBegin(this._node,
                this._getRightColLinkHtml(
                    "bartervg_ico",
                    `https://barter.vg/steam/${this._type}/${this._gameid}/`,
                    Localization.str.view_on_website.replace("__website__", "Barter.vg")
                ));
        }

        if (SyncedStorage.get("showsteamdb")) {
            HTML.afterBegin(this._node,
                this._getRightColLinkHtml(
                    "steamdb_ico",
                    `https://steamdb.info/${this._type}/${this._gameid}/`,
                    Localization.str.view_on_website.replace("__website__", "Steam Database")
                ));
        }

        if (SyncedStorage.get("showitadlinks")) {
            HTML.afterBegin(this._node,
                this._getRightColLinkHtml(
                    "itad_ico",
                    `https://isthereanydeal.com/steam/${this._type}/${this._gameid}/`,
                    Localization.str.view_on_website.replace("__website__", "IsThereAnyDeal")
                ));
        }
    }

    _getRightColLinkHtml(cls, url, str) {
        return `<a class="btnv6_blue_hoverfade btn_medium es_app_btn ${cls}" target="_blank" href="${url}">
                    <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span>
                </a>`;
    }

    _moveExtraLinks() {
        if (!SyncedStorage.get("moveextralinks")) { return; }

        const usefulLinks = this._node.parentNode;
        usefulLinks.classList.add("es_useful_link");

        const sideDetails = document.querySelector(".es_side_details_wrap");
        if (sideDetails) {
            sideDetails.insertAdjacentElement("afterend", usefulLinks);
        } else {
            document.querySelector("div.rightcol.game_meta_data").insertAdjacentElement("afterbegin", usefulLinks);
        }
    }
}
