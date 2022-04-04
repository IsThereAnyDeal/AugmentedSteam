import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FReplaceDevPubLinks extends Feature {

    apply() {

        const devs = [document.querySelector(".details_block > .dev_row:first-of-type > a")];
        const highlightsDev = document.getElementById("developers_list")?.parentElement;

        if (highlightsDev) { devs.push(highlightsDev.querySelector("a")); }

        const pubs = [document.querySelector(".details_block > .dev_row:nth-of-type(2) > a")];
        const highlightsPub = highlightsDev?.nextElementSibling;

        if (highlightsPub) { pubs.push(highlightsPub.querySelector("a")); }

        let franchise = document.querySelector(".details_block > .dev_row:nth-of-type(3) > a");
        franchise = franchise ? [franchise] : [];

        for (const node of [...devs, ...pubs, ...franchise]) {
            const homepageLink = new URL(node.href);
            if (homepageLink.pathname.startsWith("/search/")) { continue; }

            let type;
            if (devs.includes(node)) {
                type = "developer";
            } else if (pubs.includes(node)) {
                type = "publisher";
            } else if (franchise === node) {
                type = "franchise";
            }
            if (!type) { continue; }

            node.href = `https://store.steampowered.com/search/?${type}=${encodeURIComponent(node.textContent)}`;
            HTML.afterEnd(node, ` (<a href="${homepageLink.href}">${Localization.str.options.homepage}</a>)`);
        }

        for (const moreBtn of document.querySelectorAll(".dev_row > .more_btn")) {
            moreBtn.remove();
        }

        Page.runInPageContext(() => {
            window.SteamFacade.collapseLongStrings(".dev_row .summary.column");
        });
    }
}
