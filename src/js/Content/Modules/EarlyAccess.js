import {GameId} from "../../Modules/Core/GameId";
import {HTML} from "../../Modules/Core/Html/Html";
import {Localization} from "../../Modules/Core/Localization/Localization";
import {SyncedStorage} from "../../Modules/Core/Storage/SyncedStorage";
import {Language} from "../../Modules/Core/Localization/Language";
import {ExtensionResources} from "../../Modules/Core/ExtensionResources";
import {Background} from "../common";

export class EarlyAccess {

    static async getEaNodes(nodes, selectorModifier) {

        const appidsMap = new Map();

        for (const node of nodes) {
            node.classList.add("es_ea_checked");

            const linkNode = node.querySelector("a");
            const href = linkNode && linkNode.hasAttribute("href") ? linkNode.getAttribute("href") : node.getAttribute("href");
            const imgHeader = node.querySelector(`img${selectorModifier}`);
            const appid = GameId.getAppid(href) || GameId.getAppidImgSrc(imgHeader ? imgHeader.getAttribute("src") : null);

            if (appid) {
                appidsMap.set(String(appid), node);
            }
        }

        const eaStatus = await Background.action("isea", Array.from(appidsMap.keys()));

        for (const appid of appidsMap.keys()) {
            if (!eaStatus[appid]) {
                appidsMap.delete(appid);
            }
        }

        return Array.from(appidsMap.values());
    }

    static async _checkNodes(selectors, selectorModifier) {
        const _selectorModifier = typeof selectorModifier === "string" ? selectorModifier : "";
        const selector = selectors.map(selector => `${selector}:not(.es_ea_checked)`).join(",");

        for (const node of await EarlyAccess.getEaNodes(document.querySelectorAll(selector), _selectorModifier)) {
            node.classList.add("es_early_access");

            const imgHeader = node.querySelector(`img${_selectorModifier}`);
            const container = document.createElement("span");
            container.classList.add("es_overlay_container");
            DOMHelper.wrap(container, imgHeader);

            HTML.afterBegin(
                container,
                `<span class="es_overlay"><img title="${Localization.str.early_access}" src="${EarlyAccess._imageUrl}"></span>`
            );
        }
    }

    static _handleStore() {

        // TODO refactor these checks to appropriate page calls
        switch (true) {
            case /^\/app\/.*/.test(window.location.pathname):
                EarlyAccess._checkNodes([".game_header_image_ctn", ".small_cap"]);
                break;
            case /^\/(?:genre|browse|tag)\/.*/.test(window.location.pathname):
                EarlyAccess._checkNodes([".tab_item",
                    ".special_tiny_cap",
                    ".cluster_capsule",
                    ".game_capsule",
                    ".browse_tag_game",
                    ".dq_item:not(:first-child)",
                    ".discovery_queue:not(:first-child)"]);
                break;
            case /^\/search\/.*/.test(window.location.pathname):
                EarlyAccess._checkNodes([".search_result_row"]);
                break;
            case /^\/recommended/.test(window.location.pathname):
                EarlyAccess._checkNodes([".friendplaytime_appheader",
                    ".header_image",
                    ".appheader",
                    ".recommendation_carousel_item .carousel_cap",
                    ".game_capsule",
                    ".game_capsule_area",
                    ".similar_grid_capsule"]);
                break;
            case /^\/tag\/.*/.test(window.location.pathname):
                EarlyAccess._checkNodes([".cluster_capsule",
                    ".tab_row",
                    ".browse_tag_game_cap"]);
                break;
            case /^\/(?:curator|developer|dlc|publisher)\/.*/.test(window.location.pathname):
                EarlyAccess._checkNodes(["#curator_avatar_image",
                    ".capsule"]);
                break;
            case /^\/$/.test(window.location.pathname):
                EarlyAccess._checkNodes([".cap",
                    ".special",
                    ".game_capsule",
                    ".cluster_capsule",
                    ".recommended_spotlight_ctn",
                    ".curated_app_link",
                    ".dailydeal_ctn a",
                    ".tab_item:last-of-type",

                    // Sales fields
                    ".large_sale_caps a",
                    ".small_sale_caps a",
                    ".spotlight_img"]);
                break;

            // EarlyAccess._checkNodes($(".sale_capsule_image").parent()); // TODO check/remove
        }
    }

    static _handleCommunity() {

        // TODO refactor these checks to appropriate page calls
        switch (true) {
            case /^\/(?:id|profiles)\/.+\/(wishlist|games|followedgames)/.test(window.location.pathname):
                EarlyAccess._checkNodes([".gameListRowLogo"]);
                break;
            case /^\/(?:id|profiles)\/.+\/\b(home|myactivity)\b/.test(window.location.pathname):
                EarlyAccess._checkNodes([".blotter_gamepurchase_content a"]);
                break;
            case /^\/(?:id|profiles)\/.+\/\b(reviews|recommended)\b/.test(window.location.pathname):
                EarlyAccess._checkNodes([".leftcol"]);
                break;
            case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
                EarlyAccess._checkNodes([".game_info_cap",
                    ".showcase_gamecollector_game",
                    ".favoritegame_showcase_game"]);
        }
    }

    static showEarlyAccess() {
        if (!SyncedStorage.get("show_early_access")) { return; }

        let imageName = "img/overlay/early_access_banner_english.png";
        if (Language.isCurrentLanguageOneOf([
            "brazilian",
            "french",
            "italian",
            "japanese",
            "koreana",
            "polish",
            "portuguese",
            "russian",
            "schinese",
            "spanish",
            "latam",
            "tchinese",
            "thai"
        ])) {
            imageName = `img/overlay/early_access_banner_${Language.getCurrentSteamLanguage()}.png`;
        }
        EarlyAccess._imageUrl = ExtensionResources.getURL(imageName);

        switch (window.location.host) {
            case "store.steampowered.com":
                EarlyAccess._handleStore();
                break;
            case "steamcommunity.com":
                EarlyAccess._handleCommunity();
                break;
        }
    }
}
