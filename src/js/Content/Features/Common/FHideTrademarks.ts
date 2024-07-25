import ContextType from "@Content/Modules/Context/ContextType";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import type CBase from "@Content/Features/Common/CBase";
import Settings from "@Options/Data/Settings";

export default class FHideTrademarks extends Feature<CBase> {

    override checkPrerequisites(): boolean {
        return Settings.hidetmsymbols;
    }

    override apply(): void {

        // TODO I would try to reduce number of selectors here
        let selectors = "title, .apphub_AppName, .breadcrumbs, h1, h4";
        if (this.context.type === ContextType.STORE_DEFAULT) {
            selectors
                += ".game_area_already_owned, .details_block, .game_description_snippet, "
                + ".game_area_description p, .glance_details, .game_area_dlc_bubble game_area_bubble, .package_contents, "
                + ".game_area_dlc_name, .tab_desc, .tab_item_name";
        } else {
            selectors
                += ".game_suggestion, .appHubShortcut_Title, .apphub_CardContentNewsTitle, "
                + ".apphub_CardTextContent, .apphub_CardContentAppName, .apphub_AppName";
        }

        // Replaces "R", "C" and "TM" signs
        function replaceSymbols(node: Element) {

            // tfedor I don't trust this won't break any inline JS
            if (!node || !node.innerHTML) { return; }
            HTML.inner(node, node.innerHTML.replace(/[\u00AE\u00A9\u2122]/g, ""));
        }

        for (const node of document.querySelectorAll(selectors)) {
            replaceSymbols(node);
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    replaceSymbols(<Element>node);
                });
            });
        });

        const nodes = document.querySelectorAll("#game_select_suggestions,#search_suggestion_contents,.tab_content_ctn");
        for (const node of nodes) {
            observer.observe(node, {"childList": true, "subtree": true});
        }
    }
}
