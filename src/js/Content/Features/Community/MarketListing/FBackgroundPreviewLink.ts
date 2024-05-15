import {__previewBackground} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CMarketListing from "@Content/Features/Community/MarketListing/CMarketListing";
import Feature from "@Content/Modules/Context/Feature";
import User from "@Content/Modules/User";
import HTML from "@Core/Html/Html";

export default class FBackgroundPreviewLink extends Feature<CMarketListing> {

    override checkPrerequisites(): boolean {
        return this.context.appid === 753 && User.isSignedIn;
    }

    override apply(): void {

        const viewFullLink = document.querySelector<HTMLAnchorElement>("#largeiteminfo_item_actions a");
        if (viewFullLink === null) { return; }

        const bgLink = viewFullLink.href.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);
        if (bgLink) {
            HTML.afterEnd(viewFullLink,
                `<a class="es_preview_background btn_small btn_darkblue_white_innerfade" target="_blank" href="${User.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                    <span>${L(__previewBackground)}</span>
                </a>`);
        }
    }
}
