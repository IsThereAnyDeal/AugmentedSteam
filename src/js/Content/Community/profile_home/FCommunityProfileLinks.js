import {ExtensionResources, HTML, Language, Localization, SyncedStorage} from "../../../core_modules";
import {Clipboard, Feature, SteamId} from "../../../Modules/content";
import {CommunityCommon} from "../common";
import {Page} from "../../Page";

export default class FCommunityProfileLinks extends Feature {

    apply() {
        function copySteamId(e) {
            const elem = e.target.closest(".es-copy");
            if (!elem) { return; }

            Clipboard.set(elem.querySelector(".es-copy__id").innerText);

            const lastCopied = document.querySelector(".es-copy.is-copied");
            if (lastCopied) {
                lastCopied.classList.remove("is-copied");
            }

            elem.classList.add("is-copied");
            window.setTimeout(() => { elem.classList.remove("is-copied"); }, 2000);
        }

        function showSteamIdDialog() {
            document.addEventListener("click", copySteamId);

            const imgUrl = ExtensionResources.getURL("img/clippy.svg");

            const steamId = new SteamId.Detail(SteamId.getSteamId());
            const ids = [
                steamId.id2,
                steamId.id3,
                steamId.id64,
                `https://steamcommunity.com/profiles/${steamId.id64}`
            ];

            const copied = Localization.str.copied;
            let html = "";
            for (const id of ids) {
                if (!id) { continue; }
                html += `<p><a class="es-copy"><span class="es-copy__id">${id}</span><img src='${imgUrl}' class="es-copy__icon"><span class="es-copy__copied">${copied}</span></a></p>`;
            }

            Page.runInPageContext((steamidOfUser, html, close) => {
                /* eslint-disable no-undef, new-cap, camelcase */
                HideMenu("profile_action_dropdown_link", "profile_action_dropdown");
                const dialog = ShowAlertDialog(steamidOfUser.replace("__user__", g_rgProfileData.personaname), html, close);

                return new Promise(resolve => {
                    dialog.done(() => { resolve(); });
                });
                /* eslint-enable no-undef, new-cap, camelcase */
            },
            [
                Localization.str.steamid_of_user,
                html,
                Localization.str.close,
            ],
            "closeDialog")
                .then(() => { document.removeEventListener("click", copySteamId); });
        }

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
            htmlstr += CommunityCommon.makeProfileLink(link.id, link.link, link.name, iconType);
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

            htmlstr += CommunityCommon.makeProfileLink("custom", link, name, iconType, icon);
        }

        // profile steamid
        if (SyncedStorage.get("profile_steamid")) {
            const dropdown = document.querySelector("#profile_action_dropdown .popup_body.popup_menu");
            if (dropdown) {
                HTML.beforeEnd(dropdown,
                    `<a class="popup_menu_item" id="es_steamid">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/iconForums.png">&nbsp; ${Localization.str.view_steamid}
                    </a>`);
            } else {
                const actions = document.querySelector(".profile_header_actions");
                if (actions) {
                    HTML.beforeEnd(actions,
                        `<a class="btn_profile_action btn_medium" id="es_steamid">
                            <span>${Localization.str.view_steamid}</span>
                        </a>`);
                }
            }

            document.querySelector("#es_steamid").addEventListener("click", showSteamIdDialog);
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
