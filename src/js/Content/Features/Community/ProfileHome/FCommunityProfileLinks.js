import {HTML, Language, SyncedStorage} from "../../../../modulesCore";
import {CommunityUtils, Feature, SteamId} from "../../../modulesContent";

export default class FCommunityProfileLinks extends Feature {

    apply() {

        const steamId = SteamId.getSteamId();

        const links = [
            {
                "id": "steamrep",
                "link": `https://steamrep.com/profiles/${steamId}`,
                "name": "SteamRep",
            },
            {
                "id": "steamdbcalc",
                "link": `https://steamdb.info/calculator/?player=${steamId}`,
                "name": "SteamDB",
            },
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/user/${steamId}`,
                "name": "SteamGifts",
            },
            {
                "id": "steamtrades",
                "link": `https://www.steamtrades.com/user/${steamId}`,
                "name": "SteamTrades",
            },
            {
                "id": "bartervg",
                "link": `https://barter.vg/steam/${steamId}`,
                "name": "Barter.vg",
            },
            {
                "id": "astats",
                "link": `https://www.achievementstats.com/index.php?action=profile&playerId=${steamId}`,
                "name": "Achievement Stats",
            },
            {
                "id": "backpacktf",
                "link": `https://backpack.tf/profiles/${steamId}`,
                "name": "Backpack.tf",
            },
            {
                "id": "astatsnl",
                "link": `https://astats.astats.nl/astats/User_Info.php?steamID64=${steamId}`,
                "name": "AStats.nl",
            }
        ];

        // Add SteamRepCN link if language is Chinese
        const language = Language.getCurrentSteamLanguage();
        if ((language === "schinese" || language === "tchinese") && SyncedStorage.get("profile_steamrepcn")) {
            links.push({
                "id": "steamrepcn",
                "link": `https://steamrepcn.com/profiles/${steamId}`,
                "name": (language === "schinese" ? "查看信誉记录" : "確認信譽記錄")
            });
        }

        let html = "";
        let iconType = SyncedStorage.get("show_profile_link_images");

        for (const {id, link, name} of links) {
            if (!SyncedStorage.get(`profile_${id}`)) { continue; }
            html += CommunityUtils.makeProfileLink(id, link, name, iconType);
        }

        // custom profile link
        for (const customLink of SyncedStorage.get("profile_custom_link")) {
            if (!customLink.enabled) { continue; }

            let customUrl = customLink.url;
            if (!customUrl.includes("[ID]")) {
                customUrl += "[ID]";
            }

            const name = HTML.escape(customLink.name);
            const link = `//${HTML.escape(customUrl.replace("[ID]", steamId))}`;
            let icon;
            if (customLink.icon) {
                icon = `//${HTML.escape(customLink.icon)}`;
            } else {
                iconType = "none";
            }

            html += CommunityUtils.makeProfileLink("custom", link, name, iconType, icon);
        }

        if (html) {
            const linksNode = document.querySelector(".profile_item_links");
            if (linksNode) {
                HTML.beforeEnd(linksNode, `${html}<div style="clear: both;"></div>`);
            } else {
                const rightColNode = document.querySelector(".profile_rightcol");
                HTML.beforeEnd(rightColNode, `<div class="profile_item_links">${html}</div>`);
                HTML.afterEnd(rightColNode, '<div style="clear: both;"></div>');
            }
        }
    }
}
