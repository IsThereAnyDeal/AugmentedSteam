import {Context, ContextType} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FEarlyAccess from "../../Common/FEarlyAccess";
import FHideTrademarks from "../../Common/FHideTrademarks";
import FAlternativeLinuxIcon from "./FAlternativeLinuxIcon";

export class CStoreBase extends Context {

    constructor(type = ContextType.STORE_DEFAULT, features = []) {

        features.push(
            FHighlightsTags,
            FEarlyAccess,
            FHideTrademarks,
            FAlternativeLinuxIcon,
        );

        super(type, features);

        this._observeChanges();
    }

    _observeChanges() {

        // search box on the navigation bar
        const searchBox = document.querySelector("#search_suggestion_contents");
        if (searchBox) {
            new MutationObserver(mutations => {
                this._decorateStoreCapsules(mutations[0].addedNodes);
            }).observe(searchBox, {"childList": true});
        }

        // genre, category, tags etc. pages
        const tabContent = document.querySelector(".tab_content_ctn");
        if (tabContent) {
            new MutationObserver(mutations => {
                for (const {addedNodes} of mutations) {
                    if (addedNodes.length > 1) {
                        const nodes = Array.from(addedNodes)
                            .filter(el => el instanceof Element && el.classList.contains("tab_item"));

                        this._decorateStoreCapsules(nodes);
                    }
                }
            }).observe(tabContent, {"childList": true, "subtree": true});

            return;
        }

        // recommended/friendactivity
        const friendactivityTab = document.querySelector("#friendactivity_tabarea");
        if (friendactivityTab) {
            new MutationObserver(mutations => {
                for (const {addedNodes} of mutations) {
                    if (addedNodes.length > 1) {
                        const nodes = Array.from(addedNodes)
                            .filter(el => el instanceof Element && el.querySelector(".friendactivity_game_link") !== null);

                        this._decorateStoreCapsules(nodes);
                    }
                }
            }).observe(friendactivityTab, {"childList": true, "subtree": true});

            return;
        }

        const container = document.querySelector([
            "#tag_browse_games_ctn", // tag/browse
            "#RecommendationsRows", // curator, developer, publisher, franchise, dlc etc. pages
            "#CuratorsRows", // curators/recommendedcurators
        ].join(","));

        if (container) {
            new MutationObserver(mutations => {
                for (const {addedNodes} of mutations) {
                    if (addedNodes.length > 0 && addedNodes[0] instanceof Element) {
                        const nodes = addedNodes[0].querySelectorAll(".browse_tag_game, .store_capsule, .recommendation");
                        this._decorateStoreCapsules(nodes);
                    }
                }
            }).observe(container, {"childList": true, "subtree": true});
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
                        this._decorateStoreCapsules(addedNodes[0].children);
                    }
                    observer.disconnect();
                }).observe(node, {"childList": true});
            }
        }

        /**
         * The "recommended curators" section is lazy-loaded if the "apps recommended by curators" section is empty (`rgCuratedAppsData` is an empty array)
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
                            this._decorateStoreCapsules(nodes, false); // This section doesn't have dsinfo for some reason
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
                        this._decorateStoreCapsules(nodes);
                    }
                }
            }).observe(contentNode, {"childList": true});
        }
    }

    _decorateStoreCapsules(nodes, hasDsInfo) {
        FHighlightsTags.highlightAndTag(nodes, hasDsInfo);
        FEarlyAccess.show(nodes);
    }
}
