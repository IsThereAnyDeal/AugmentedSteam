import {HTML, HTMLParser, Localization, SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";

export default class FExtraLinks extends Feature {

    checkPrerequisites() {
        const context = this.context;

        if (context.type === ContextType.APP) {
            this._type = "app";
            this._gameid = context.appid;

            if (context.isErrorPage) {
                this._node = document.querySelector("#error_box");
            } else {
                this._node = document.querySelector("#shareEmbedRow");
            }
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

            // Even if the user doesn't want to see any extra links, the position of the share/embed links is changed
            this._type === "app"

            // Preferences for links shown on all pages
            || (SyncedStorage.get("showbartervg")
            || SyncedStorage.get("showsteamdb")
            || SyncedStorage.get("showitadlinks"))
        );
    }

    apply() {

        const isAppPage = this._type === "app";
        const appName = typeof this.context.appName === "string" && HTMLParser.clearSpecialSymbols(this.context.appName);

        // Note: Links should be rendered in the same order as displayed on the options page
        const links = this._getLinks(isAppPage, appName);

        if (isAppPage) {

            if (this.context.isErrorPage) {

                // Add a Community Hub button to roughly where it normally is
                HTML.beforeBegin("h2.pageheader",
                    `<div class="es_apphub_OtherSiteInfo">
                        <a class="btnv6_blue_hoverfade btn_medium" href="//steamcommunity.com/app/${this._gameid}/">
                            <span>${Localization.str.community_hub}</span>
                        </a>
                    </div>`);
            } else {

                // Move share/embed links to the top of the right column
                const sideDetails = document.querySelector(".es_side_details_wrap");
                if (sideDetails) {
                    sideDetails.insertAdjacentElement("afterend", this._node);
                } else {
                    document.querySelector("div.rightcol.game_meta_data").insertAdjacentElement("afterbegin", this._node);
                }
            }

            // custom app link
            for (const customLink of SyncedStorage.get("app_custom_link")) {

                const link = `//${HTML.escape(customLink.url
                    .replace("[NAME]", appName ? encodeURIComponent(appName) : "")
                    .replace("[ID]", this._gameid))}`;
                const text = Localization.str.view_on_website.replace("__website__", HTML.escape(customLink.name));
                const iconUrl = customLink.icon ? `url(//${HTML.escape(customLink.icon)})` : "none";

                links.push({link, text, iconUrl, "enabled": customLink.enabled});
            }
        }

        let html = "";
        for (const link of links) {
            if (!link.enabled) { continue; }

            const icon = link.iconClass ? "" : `style="background: ${link.iconUrl}; background-size: contain;"`;
            html += `<a class="btnv6_blue_hoverfade btn_medium es_app_btn ${link.iconClass || ""}" target="_blank" href="${link.link}">
                        <span><i class="ico16" ${icon}></i>${link.text}</span>
                    </a>`;
        }

        if (html) {
            if (this.context.isErrorPage) {
                HTML.afterEnd(this._node, `<div class="es_extralinks_ctn">${html}</div>`);
            } else {
                HTML.afterBegin(this._node, html);
            }
        }
    }

    _getLinks(isAppPage, appName) {
        return [
            {
                "iconClass": "itad_ico",
                "link": `https://isthereanydeal.com/steam/${this._type}/${this._gameid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "IsThereAnyDeal"),
                "enabled": SyncedStorage.get("showitadlinks"),
            },
            {
                "iconClass": "steamdb_ico",
                "link": `https://steamdb.info/${this._type}/${this._gameid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "SteamDB"),
                "enabled": SyncedStorage.get("showsteamdb"),
            },
            {
                "iconClass": "bartervg_ico",
                "link": `https://barter.vg/steam/${this._type}/${this._gameid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "Barter.vg"),
                "enabled": SyncedStorage.get("showbartervg"),
            },
            {
                "iconClass": "cardexchange_btn",
                "link": `https://www.steamcardexchange.net/index.php?gamepage-appid-${this.context.communityAppid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "Steam Card Exchange"),
                "enabled": isAppPage && this.context.hasCards && SyncedStorage.get("showsteamcardexchange"),
            },
            {
                "iconClass": "protondb_btn",
                "link": `https://www.protondb.com/app/${this.context.appid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "ProtonDB"),
                "enabled": isAppPage && SyncedStorage.get("showprotondb"),
            },
            {
                "iconClass": "completionistme_btn",
                "link": `https://completionist.me/steam/app/${this.context.appid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "Completionist.me"),
                "enabled": isAppPage && SyncedStorage.get("showcompletionistme"),
            },
            {
                "iconClass": "pcgw_btn",
                "link": `https://pcgamingwiki.com/api/appid.php?appid=${this.context.appid}`,
                "text": Localization.str.wiki_article.replace("__pcgw__", "PCGamingWiki"),
                "enabled": isAppPage && SyncedStorage.get("showpcgw"),
            },
            {
                "iconClass": "twitch_btn",
                "link": `https://www.twitch.tv/directory/game/${encodeURIComponent(appName)}`,
                "text": Localization.str.view_on_website.replace("__website__", "Twitch"),
                "enabled": isAppPage && appName && SyncedStorage.get("showtwitch"),
            },
            {
                "iconClass": "as_youtube_btn",
                "link": `https://www.youtube.com/results?search_query=${encodeURIComponent(appName)}`,
                "text": Localization.str.view_on_website.replace("__website__", "YouTube"),
                "enabled": isAppPage && appName && SyncedStorage.get("showyoutube"),
            },
            {
                "iconClass": "as_youtube_btn",
                "link": `https://www.youtube.com/results?search_query=${encodeURIComponent(`${appName} "PC Gameplay"`)}`,
                "text": Localization.str.youtube_gameplay,
                "enabled": isAppPage && appName && SyncedStorage.get("showyoutubegameplay"),
            },
            {
                "iconClass": "as_youtube_btn",
                "link": `https://www.youtube.com/results?search_query=${encodeURIComponent(`${appName} "PC" intitle:Review`)}`,
                "text": Localization.str.youtube_reviews,
                "enabled": isAppPage && appName && SyncedStorage.get("showyoutubereviews"),
            },
        ];
    }
}
