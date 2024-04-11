import {ExtensionResources, GameId, Language, SyncedStorage} from "../../../modulesCore";
import {Background, Feature} from "../../modulesContent";

import EarlyAccess from "./EarlyAccess.svelte";

// TODO support React-based sales pages, curator lists, etc.
const storeSelectors = [
    ".tab_item", // Item rows on storefront
    ".newonsteam_headercap", // explore/new
    ".comingsoon_headercap", // explore/upcoming
    ".store_capsule",
    ".dailydeal_ctn",
    ".special.special_img_ctn", // explore/new, cart/
    /*
     * These use CSS backgrounds instead of img elements, unsupported for now
     * ".store_main_capsule", // Featured & Recommended
     * ".home_marketing_message", // Updates and Offers
     */
    ".home_area_spotlight", // Special Offers, specials/
    ".curator_giant_capsule", // Curator Recommendations
    ".home_content_item", // Recommendations at the bottom of the storefront (small)
    ".home_content.single > .gamelink", // ...aforementioned (big)
    ".highlighted_app_header", // curators/
    "body.dlc_curator #curator_avatar_image", // Header image on dlc pages
    ".curator_featured .capsule", // Featured items on curator, developer, publisher, franchise, dlc etc. pages
    ".search_result_row",
    ".small_cap", // "recommended" section on app pages
    ".browse_tag_game_cap", // tag/browse
    ".recommendation_highlight > .header_image", // recommended/morelike, recommended/friendactivity/
    ".similar_grid_item", // recommended/morelike
    ".friend_game_block > .game_capsule", // recommended/friendactivity/
    ".friendactivity_tab_row", // recommended/friendactivity/
    ".recommendation_app", // recommended/byfriends/
    ".recommendation_carousel_item",
    ".app_header",
    ".friendplaytime_appheader",
];

const communitySelectors = [
    // Selectors for Profile Home are split out due to issues with running them on my/edit/showcases
    ".gameLogo", // Various game community pages e.g. global/personal achievements
    ".blotter_gamepurchase_logo", // activity home
    ".gameLogoHolder_default", // activity home, individual reviews
    ".game_capsule_ctn", // reviews list
];

const selector = (window.location.hostname === "store.steampowered.com" ? storeSelectors : communitySelectors)
    .join(",");

export default class FEarlyAccess extends Feature {

    public static async show(nodes?: NodeListOf<Element>): Promise<void> {
        if (!SyncedStorage.get("show_early_access")) { return; }

        const _nodes = nodes ?? document.querySelectorAll(selector);
        if (_nodes.length === 0) { return; }

        // TODO add missing images for supported locales
        let imageName = "img/overlay/early_access_banner_english.png";
        if (Language.isCurrentLanguageOneOf(
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
        )) {
            imageName = `img/overlay/early_access_banner_${Language.getCurrentSteamLanguage()}.png`;
        }

        const imageUrl = ExtensionResources.getURL(imageName);

        for (const node of await this.getEaNodes(_nodes)) {

            /*
             * TODO It's possible a child element has been checked already, remove when not needed
             * e.g. duplicate elements on the storefront (More Curator Recommendations)
             * and when called with the same arguments as highlighting (observing changes in CStoreBase)
             */
            if (node.querySelector(".es_overlay_container") !== null) { continue; }

            node.classList.add("es_early_access");

            const imgHeader = node.querySelector("img");
            if (!imgHeader) { continue; }

            new EarlyAccess({
                "target": imgHeader.parentElement,
                "anchor": imgHeader, // Render the component "before" the original image
                "props": {
                    imageUrl,
                    imgHeader,
                },
            });
        }
    }

    public override async apply(): Promise<void> {
        await FEarlyAccess.show();
    }



    static async getEaNodes(nodes: NodeList) {

        const appidsMap = new Map();

        for (const node of nodes) {

            if (node.classList.contains("es_ea_checked")) { continue; }
            node.classList.add("es_ea_checked");

            // Skip the live streams section since the thumbnail is shown on top
            if (node.classList.contains("store_capsule") && node.querySelector(".capsule[id^=broadcast]") !== null) {
                continue;
            }

            let appid = GameId.getAppid(node)
                || GameId.getAppid(node.querySelector("a"))
                || GameId.getAppidImgSrc(node.querySelector("img"));

            if (appid) {
                appid = String(appid);
                if (appidsMap.has(appid)) {
                    appidsMap.get(appid).push(node);
                } else {
                    appidsMap.set(appid, [node]);
                }
            } else {
                console.warn("FEarlyAccess: Couldn't find appid for node %o", node);
            }
        }

        if (appidsMap.size === 0) { return []; }

        const eaStatus = await Background.action("isea", Array.from(appidsMap.keys()));

        return Array.from(appidsMap).flatMap(([appid, nodesArray]) => {
            return eaStatus[appid] ? nodesArray : [];
        });
    }
}
