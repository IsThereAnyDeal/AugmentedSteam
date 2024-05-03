import HTMLParser from "@Core/Html/HtmlParser";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FHideReportedTags extends Feature {

    checkPrerequisites() {
        // This feature intends to remove reported tags mistakenly shown as user-defined, see #1423
        this._yourTags = document.querySelectorAll(".app_tag.user_defined");
        return this._yourTags.length > 0;
    }

    apply() {

        /**
         * The second argument passed to `InitAppTagModal()` is an array of user tags
         * https://github.com/SteamDatabase/SteamTracking/blob/590b40f75e2ed3a1a314f64448d466a812b6a686/store.steampowered.com/public/javascript/app_tagging.js#L63
         */
        const userTags = HTMLParser.getArrayVariable(/\[{"tagid".+}\],\s*(\[{"tagid".+}\])/);
        if (!userTags) { return; }

        const reportedTagNames = new Set();

        for (const tag of userTags) {
            if (tag.is_reported) {
                reportedTagNames.add(tag.name);
            }
        }

        if (reportedTagNames.size === 0) { return; }

        for (const tagNode of this._yourTags) {
            if (reportedTagNames.has(tagNode.textContent.trim())) {
                tagNode.remove();
            }
        }

        // trigger displaying additional popular tags
        Page.runInPageContext(() => {
            window.SteamFacade.jq(window).trigger("resize");
        });
    }
}
