import {Feature} from "modules";
import {HTML} from "../../../Modules/Core/Html/Html";
import {Localization} from "../../../Modules/Core/Localization/Localization";
import {ExtensionLayer} from "common";

export default class FReplaceDevPubLinks extends Feature {

    apply() {
        const devs = Array.from(
            document.querySelectorAll("#developers_list > a, .details_block > .dev_row:first-of-type > a")
        );
        const pubs = Array.from(
            document.querySelectorAll(".user_reviews > .dev_row:last-of-type a, .details_block > .dev_row:nth-of-type(2) > a")
        );
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

        // eslint-disable-next-line new-cap, no-undef
        ExtensionLayer.runInPageContext(() => { CollapseLongStrings(".dev_row .summary.column"); });
    }
}
