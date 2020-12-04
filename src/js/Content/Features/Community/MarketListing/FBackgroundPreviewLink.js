import {HTML, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

export default class FBackgroundPreviewLink extends Feature {

    checkPrerequisites() {
        return this.context.appid === 753 && User.isSignedIn;
    }

    apply() {

        const viewFullLink = document.querySelector("#largeiteminfo_item_actions a");
        if (viewFullLink === null) { return; }

        const bgLink = viewFullLink.href.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);
        if (bgLink) {
            HTML.afterEnd(viewFullLink,
                `<a class="es_preview_background btn_small btn_darkblue_white_innerfade" target="_blank" href="${User.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                    <span>${Localization.str.preview_background}</span>
                </a>`);
        }
    }
}
