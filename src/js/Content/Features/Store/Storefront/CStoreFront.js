import {ContextType, User} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import FCustomizer from "../Common/FCustomizer";
import FHomePageTab from "./FHomePageTab";

export class CStoreFront extends CStoreBase {

    constructor() {

        super(ContextType.STORE_FRONT, [
            FCustomizer,
            FHomePageTab,
        ]);

        if (User.isSignedIn) { // TODO ITAD status
            this.monitorStoreFront();
        }
    }

    monitorStoreFront() {

        /**
         * Lazy-loaded sections
         * https://github.com/SteamDatabase/SteamTracking/blob/524ff1a7d552fc9c9a4fde992d3a79d3a98a93d0/store.steampowered.com/public/javascript/home.js#L117
         */
        const nodes = document.querySelectorAll(".recently_updated, #friends_carousel > .carousel_items");
        for (const node of nodes) {
            if (node.childElementCount === 0) {
                new MutationObserver((mutations, observer) => {
                    for (const {addedNodes} of mutations) {
                        this.decorateStoreCapsules(addedNodes[0].children);
                    }
                    observer.disconnect();
                }).observe(node, {"childList": true});
            }
        }

        /**
         * The "recommended curators" section is lazy-loaded if the "apps recommended by curators"
         * section is empty (`rgCuratedAppsData` is an empty array)
         * https://github.com/SteamDatabase/SteamTracking/blob/524ff1a7d552fc9c9a4fde992d3a79d3a98a93d0/store.steampowered.com/public/javascript/home.js#L2842
         */
        const curatorsNode = document.querySelector("#steam_curators_not_empty");
        if (
            curatorsNode !== null
            && !curatorsNode.querySelector(".store_capsule")
            && document.querySelector(".apps_recommended_by_curators_ctn").style.display === "none"
        ) {
            new MutationObserver((mutations, observer) => {
                for (const {addedNodes} of mutations) {
                    for (const node of addedNodes) {
                        if (!(node instanceof Element)) { continue; }
                        const nodes = node.querySelectorAll(".store_capsule");

                        // This section goes through multiple rendering steps before apps show up, so don't disconnect immediately
                        if (nodes.length !== 0) {
                            this.decorateStoreCapsules(nodes, false); // This section doesn't have dsinfo for some reason
                            observer.disconnect();
                        }
                    }
                }
            }).observe(curatorsNode, {"childList": true, "subtree": true});
        }

        // Recommendations at the bottom
        const contentNode = document.querySelector("#content_more");
        if (contentNode) {
            new MutationObserver(mutations => {
                for (const {addedNodes} of mutations) {
                    for (const node of addedNodes) {
                        if (!(node instanceof Element)) { continue; }
                        const nodes = node.querySelectorAll(".home_content_item, .home_content.single");
                        this.decorateStoreCapsules(nodes);
                    }
                }
            }).observe(contentNode, {"childList": true});
        }

        // Top sellers tab
        const topSellersTab = document.querySelector("#tab_topsellers_content");
        if (topSellersTab) {
            // TODO Steam broke this section, remove when fixed
            if (!topSellersTab.querySelector(".tab_content_items")) { return; }

            new MutationObserver(mutations => {
                for (const {addedNodes} of mutations) {
                    if (addedNodes.length > 1) {
                        const nodes = Array.from(addedNodes)
                            .filter(el => el instanceof Element && el.classList.contains("tab_item"));

                        this.decorateStoreCapsules(nodes);
                    }
                }
            }).observe(topSellersTab.querySelector(".tab_content_items"), {"childList": true});
        }
    }
}
