import {L} from "@Core/Localization/Localization";
import {__options_homepage} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import HTML from "@Core/Html/Html";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

export default class FReplaceDevPubLinks extends Feature<CApp> {

    override apply(): void {

        const devs = [...document.querySelectorAll<HTMLAnchorElement>("#genresAndManufacturer > .dev_row:first-of-type > a")];

        // We need to use this element to locate the row that contains developer info, see #1346
        const glanceDevRow = document.getElementById("developers_list")?.parentElement;
        if (glanceDevRow) {
            devs.push(...glanceDevRow.querySelectorAll("a"));
        }

        const pubs = [...document.querySelectorAll<HTMLAnchorElement>("#genresAndManufacturer > .dev_row:nth-of-type(2) > a")];

        const glancePubRow = glanceDevRow?.nextElementSibling;
        if (glancePubRow) {
            pubs.push(...glancePubRow.querySelectorAll("a"));
        }

        let franchiseRow = document.querySelector<HTMLAnchorElement>(".details_block > .dev_row:nth-of-type(3) > a");
        let franchise = franchiseRow ? [franchiseRow] : [];

        for (const node of [...devs, ...pubs, ...franchise]) {
            const homepageLink = new URL(node.href);
            if (homepageLink.pathname.startsWith("/search/")) { continue; }

            let type;
            if (devs.includes(node)) {
                type = "developer";
            } else if (pubs.includes(node)) {
                type = "publisher";
            } else if (franchiseRow === node) {
                type = "franchise";
            }
            if (!type) { continue; }

            node.href = `https://store.steampowered.com/search/?${type}=${encodeURIComponent(node.textContent!)}`;
            HTML.afterEnd(node, ` (<a href="${homepageLink.href}">${L(__options_homepage)}</a>)`);
        }

        for (const moreBtn of document.querySelectorAll(".dev_row > .more_btn")) {
            moreBtn.remove();
        }

        SteamFacade.collapseLongStrings(".dev_row .summary.column");
    }
}
