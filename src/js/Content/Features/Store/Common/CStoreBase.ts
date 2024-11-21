import FHighlightsTags from "../../Common/FHighlightsTags";
import FAlternativeLinuxIcon from "./FAlternativeLinuxIcon";
import FSkipGotSteamDialog from "./FSkipGotSteamDialog";
import FHorizontalScrolling from "./FHorizontalScrolling";
import CBase from "@Content/Features/Common/CBase";
import ContextType from "@Content/Modules/Context/ContextType";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";
import EarlyAccessUtils from "@Content/Modules/EarlyAccess/EarlyAccessUtils";
import type Feature from "@Content/Modules/Context/Feature";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";

export default class CStoreBase extends CBase {

    constructor(
        params: ContextParams,
        type = ContextType.STORE_DEFAULT,
        features: (typeof Feature<Context>)[] = []
    ) {
        features.push(
            FHighlightsTags,
            FAlternativeLinuxIcon,
            FSkipGotSteamDialog,
            FHorizontalScrolling,
        );

        super(params, type, features);

        this._observeChanges();
    }

    getAllSubids(): string[] {
        const result: string[] = [];
        for (const node of document.querySelectorAll<HTMLInputElement>("input[name=subid]")) {
            if (node.value) {
                result.push(node.value);
            }
        }
        return result;
    }

    private _observeChanges(): void {

        // search box on the navigation bar
        const searchBox = document.querySelector("#search_suggestion_contents");
        if (searchBox) {
            new MutationObserver(mutations => {
                const nodes = Array.from(mutations[0]!.addedNodes as NodeListOf<HTMLElement>)
                    .filter(el => el.classList.contains("match_app"));

                this.decorateStoreCapsules(nodes);
            }).observe(searchBox, {"childList": true});
        }

        // genre, category, tags etc. pages
        const tabContent = document.querySelector(".tab_content_ctn");
        if (tabContent) {
            new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    const addedNodes = mutation.addedNodes as NodeListOf<HTMLElement>;
                    if (addedNodes.length > 1) {
                        const nodes = Array.from(addedNodes)
                            .filter(el => el instanceof Element && el.classList.contains("tab_item"));

                        this.decorateStoreCapsules(nodes);
                    }
                }
            }).observe(tabContent, {"childList": true, "subtree": true});

            return;
        }

        // recommended/friendactivity
        const friendactivityTab = document.querySelector("#friendactivity_tabarea");
        if (friendactivityTab) {
            new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    const addedNodes = mutation.addedNodes as NodeListOf<HTMLElement>;
                    if (addedNodes.length > 1) {
                        const nodes = Array.from(addedNodes)
                            .filter(el => el instanceof Element
                                && el.querySelector<HTMLElement>(".friendactivity_game_link") !== null);

                        this.decorateStoreCapsules(nodes);
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
                        const nodes = addedNodes[0].querySelectorAll<HTMLElement>(".browse_tag_game, .store_capsule, .recommendation");
                        this.decorateStoreCapsules(nodes);
                    }
                }
            }).observe(container, {"childList": true, "subtree": true});
        }
    }

    decorateStoreCapsules(nodes: NodeListOf<HTMLElement>|Array<HTMLElement>): void {
        HighlightsTagsUtils.highlightAndTag(nodes);
        EarlyAccessUtils.show(this.language, nodes);
    }
}
