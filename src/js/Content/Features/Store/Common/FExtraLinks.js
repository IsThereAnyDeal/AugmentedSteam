import {HTML, HTMLParser, Localization, SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";

export default class FExtraLinks extends Feature {

    checkPrerequisites() {
        const context = this.context;

        if (context.type === ContextType.APP) {
            this._type = "app";
            this._gameid = context.appid;
            this._node = document.querySelector("#shareEmbedRow");
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

            // Even if the user doesn't want to see any extra links, the place of the native links is changed (see _moveExtraLinks)
            this._type === "app"

            // Preferences for links shown on all pages
            || (SyncedStorage.get("showbartervg")
            || SyncedStorage.get("showsteamdb")
            || SyncedStorage.get("showitadlinks"))
        );
    }

    apply() {

        // Note: Links should be rendered in the same order as displayed on the options page
        const links = [
            {
                "id": "showitadlinks",
                "className": "itad_ico",
                "link": `https://isthereanydeal.com/steam/${this._type}/${this._gameid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "IsThereAnyDeal"),
            },
            {
                "id": "showsteamdb",
                "className": "steamdb_ico",
                "link": `https://steamdb.info/${this._type}/${this._gameid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "SteamDB"),
            },
            {
                "id": "showbartervg",
                "className": "bartervg_ico",
                "link": `https://barter.vg/steam/${this._type}/${this._gameid}/`,
                "text": Localization.str.view_on_website.replace("__website__", "Barter.vg"),
            },
        ];

        if (this._type === "app") {

            this._moveExtraLinks();

            const appName = HTMLParser.clearSpecialSymbols(this.context.appName);

            if (this.context.hasCards) {
                // FIXME some dlc have card category yet no card
                links.push({
                    "id": "showsteamcardexchange",
                    "className": "cardexchange_btn",
                    "link": `https://www.steamcardexchange.net/index.php?gamepage-appid-${this.context.communityAppid}/`,
                    "text": Localization.str.view_on_website.replace("__website__", "Steam Card Exchange"),
                });
            }

            links.push(
                {
                    "id": "showprotondb",
                    "className": "protondb_btn",
                    "link": `https://www.protondb.com/app/${this.context.appid}/`,
                    "text": Localization.str.view_on_website.replace("__website__", "ProtonDB"),
                },
                {
                    "id": "showcompletionistme",
                    "className": "completionistme_btn",
                    "link": `https://completionist.me/steam/app/${this.context.appid}/`,
                    "text": Localization.str.view_on_website.replace("__website__", "Completionist.me"),
                },
                {
                    "id": "showpcgw",
                    "className": "pcgw_btn",
                    "link": `https://pcgamingwiki.com/api/appid.php?appid=${this.context.appid}`,
                    "text": Localization.str.wiki_article.replace("__pcgw__", "PCGamingWiki"),
                },
                {
                    "id": "showtwitch",
                    "className": "twitch_btn",
                    "link": `https://www.twitch.tv/directory/game/${encodeURIComponent(appName)}`,
                    "text": Localization.str.view_on_website.replace("__website__", "Twitch"),
                },
                {
                    "id": "showyoutube",
                    "className": "youtube_btn",
                    "link": `https://www.youtube.com/results?search_query=${encodeURIComponent(appName)}`,
                    "text": Localization.str.view_on_website.replace("__website__", "YouTube"),
                },
                {
                    "id": "showyoutubegameplay",
                    "className": "youtube_btn",
                    "link": `https://www.youtube.com/results?search_query=${encodeURIComponent(`${appName} "PC Gameplay"`)}`,
                    "text": Localization.str.youtube_gameplay,
                },
                {
                    "id": "showyoutubereviews",
                    "className": "youtube_btn",
                    "link": `https://www.youtube.com/results?search_query=${encodeURIComponent(`${appName} "PC" intitle:Review`)}`,
                    "text": Localization.str.youtube_reviews,
                },
            );

            // custom app link
            for (const customLink of SyncedStorage.get("app_custom_link")) {
                if (!customLink.enabled) { continue; }

                const link = `//${HTML.escape(customLink.url
                    .replace("[NAME]", encodeURIComponent(appName))
                    .replace("[ID]", this.context.appid))}`;
                const text = Localization.str.view_on_website.replace("__website__", HTML.escape(customLink.name));
                const iconUrl = customLink.icon ? `url(//${HTML.escape(customLink.icon)})` : "none";

                links.push({link, text, iconUrl});
            }
        }

        // Loop backwards, because links are inserted at the "afterbegin" position
        for (let i = links.length - 1; i >= 0; i--) {
            const link = links[i];
            if (link.id && !SyncedStorage.get(link.id)) { continue; }

            const icon = link.className ? "" : `style="background: ${link.iconUrl}; background-size: contain;"`;
            HTML.afterBegin(
                this._node,
                `<a class="btnv6_blue_hoverfade btn_medium es_app_btn ${link.className || ""}" target="_blank" href="${link.link}">
                    <span><i class="ico16" ${icon}></i>&nbsp;&nbsp; ${link.text}</span>
                </a>`
            );
        }
    }

    _moveExtraLinks() {

        const usefulLinks = this._node;
        usefulLinks.classList.add("es_useful_link");

        const sideDetails = document.querySelector(".es_side_details_wrap");
        if (sideDetails) {
            sideDetails.insertAdjacentElement("afterend", usefulLinks);
        } else {
            document.querySelector("div.rightcol.game_meta_data").insertAdjacentElement("afterbegin", usefulLinks);
        }
    }
}
