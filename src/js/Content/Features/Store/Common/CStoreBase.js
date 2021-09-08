import {Context, ContextType} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FEarlyAccess from "../../Common/FEarlyAccess";
import FHideTrademarks from "../../Common/FHideTrademarks";
import FAlternativeLinuxIcon from "./FAlternativeLinuxIcon";

export class CStoreBase extends Context {

    constructor(type = ContextType.STORE_DEFAULT, features = []) {

        // TODO Split this up into the relevant contexts
        features.push(
            FHighlightsTags,
            FEarlyAccess,
            FAlternativeLinuxIcon,
            FHideTrademarks,
        );

        super(type, features);

        this._observeChanges();
    }

    _observeChanges() {

        // genre, category, tags etc. pages
        const tabContent = document.querySelector(".tab_content_ctn");
        if (tabContent) {
            new MutationObserver(mutations => {
                for (const {addedNodes} of mutations) {
                    if (addedNodes.length > 1) {
                        const nodes = Array.from(addedNodes)
                            .filter(el => el instanceof Element && el.classList.contains("tab_item"));

                        FHighlightsTags.highlightAndTag(nodes);
                        FEarlyAccess.show(nodes);
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

                        FHighlightsTags.highlightAndTag(nodes);
                        FEarlyAccess.show(nodes);
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

        if (!container) { return; }

        new MutationObserver(mutations => {
            for (const {addedNodes} of mutations) {
                if (addedNodes.length > 0 && addedNodes[0] instanceof Element) {
                    const nodes = addedNodes[0].querySelectorAll(".browse_tag_game, .store_capsule, .recommendation");

                    FHighlightsTags.highlightAndTag(nodes);
                    FEarlyAccess.show(nodes);
                }
            }
        }).observe(container, {"childList": true, "subtree": true});
    }
}
