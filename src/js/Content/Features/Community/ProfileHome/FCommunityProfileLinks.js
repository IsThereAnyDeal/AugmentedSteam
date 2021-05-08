import {HTML, Language, SyncedStorage} from "../../../../modulesCore";
import {CommunityUtils, Feature, SteamId} from "../../../modulesContent";

export default class FCommunityProfileLinks extends Feature {

    apply() {

        const steamId = SteamId.getSteamId();

        let iconType = "none";
        const images = SyncedStorage.get("show_profile_link_images");
        if (images !== "none") {
            iconType = images === "color" ? "color" : "gray";
        }

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
                "link": `//barter.vg/steam/${steamId}`,
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

        // Add "SteamRepCN"
        const language = Language.getCurrentSteamLanguage();
        if ((language === "schinese" || language === "tchinese") && SyncedStorage.get("profile_steamrepcn")) {
            links.push({
                "id": "steamrepcn",
                "link": `//steamrepcn.com/profiles/${steamId}`,
                "name": (language === "schinese" ? "查看信誉记录" : "確認信譽記錄")
            });
        }

        // Build the links HTML
        let htmlstr = "";

        for (const link of links) {
            if (!SyncedStorage.get(`profile_${link.id}`)) { continue; }
            htmlstr += CommunityUtils.makeProfileLink(link.id, link.link, link.name, iconType);
        }

        // custom profile link
        for (const customLink of SyncedStorage.get("profile_custom_link")) {
            if (!customLink || !customLink.enabled) {
                continue;
            }

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

            htmlstr += CommunityUtils.makeProfileLink("custom", link, name, iconType, icon);
        }

        // Insert the links HMTL into the page
        if (htmlstr) {
            const linksNode = document.querySelector(".profile_item_links");
            if (linksNode) {
                HTML.beforeEnd(linksNode, `${htmlstr}<div style="clear: both;"></div>`);
            } else {
                const rightColNode = document.querySelector(".profile_rightcol");
                HTML.beforeEnd(rightColNode, `<div class="profile_item_links">${htmlstr}</div>`);
                HTML.afterEnd(rightColNode, '<div style="clear: both;"></div>');
            }
        }
    }
}
