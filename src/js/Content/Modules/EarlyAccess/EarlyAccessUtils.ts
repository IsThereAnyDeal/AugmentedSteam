import EarlyAccess from "./EarlyAccess.svelte";
import Settings from "@Options/Data/Settings";
import AppId from "@Core/GameId/AppId";
import Language from "@Core/Localization/Language";
import ExtensionResources from "@Core/ExtensionResources";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";

export default class EarlyAccessUtils {

    // TODO support React-based sales pages, curator lists, etc.
    private static readonly storeSelectors = [
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

    private static readonly communitySelectors = [
        // Selectors for Profile Home are split out due to issues with running them on my/edit/showcases
        ".gameLogo", // Various game community pages e.g. global/personal achievements
        ".blotter_gamepurchase_logo", // activity home
        ".gameLogoHolder_default", // activity home, individual reviews
        ".game_capsule_ctn", // reviews list
    ];

    private static readonly selector = (window.location.hostname === "store.steampowered.com" ? this.storeSelectors : this.communitySelectors)
        .join(",");

    public static async show(language: Language|null, nodes?: NodeListOf<HTMLElement>|Array<HTMLElement>): Promise<void> {
        if (!Settings.show_early_access || !language) { return; }

        const _nodes: NodeListOf<HTMLElement>|Array<HTMLElement> = nodes ?? document.querySelectorAll(this.selector);
        if (_nodes.length === 0) { return; }

        // TODO add missing images for supported locales
        let imageName = "img/overlay/early_access_banner_english.png";
        if (language.isOneOf(
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
            imageName = `img/overlay/early_access_banner_${language.name}.png`;
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
                target: imgHeader.parentElement!,
                anchor: imgHeader, // Render the component "before" the original image
                props: {
                    imageUrl,
                    imgHeader,
                },
            });
        }
    }

    static async getEaNodes(nodes: Iterable<HTMLElement>): Promise<HTMLElement[]> {

        const appidsMap: Map<number, HTMLElement[]> = new Map();

        for (const node of nodes) {
            if (node.classList.contains("es_ea_checked")) {
                continue;
            }
            node.classList.add("es_ea_checked");

            // Skip the live streams section since the thumbnail is shown on top
            if (node.classList.contains("store_capsule") && node.querySelector(".capsule[id^=broadcast]") !== null) {
                continue;
            }

            let appid = AppId.fromElement(node)
                || AppId.fromElement(node.querySelector<HTMLAnchorElement>("a"))
                || AppId.fromElement(node.querySelector<HTMLImageElement>("img"));

            if (appid) {
                const nodes = (appidsMap.get(appid) ?? []);
                nodes.push(node);
                appidsMap.set(appid, nodes);
            } else {
                // console.warn("FEarlyAccess: Couldn't find appid for node %o", node);
            }
        }

        if (appidsMap.size === 0) {
            return [];
        }

        const eaStatus = await AugmentedSteamApiFacade.isEarlyAccess([...appidsMap.keys()]);

        return Array.from(appidsMap).flatMap(([appid, nodesArray]) => {
            return eaStatus[appid] ? nodesArray : [];
        });
    }
}
