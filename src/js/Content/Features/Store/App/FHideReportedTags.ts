import HTMLParser from "@Core/Html/HtmlParser";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";

export default class FHideReportedTags extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        // FIXME settings
        return true;
    }

    override async apply(): Promise<void> {
        // This feature intends to remove reported tags mistakenly shown as user-defined, see #1423
        const yourTags = document.querySelectorAll<HTMLElement>(".app_tag.user_defined");
        if (yourTags.length === 0) {
            return;
        }

        /**
         * The second argument passed to `InitAppTagModal()` is an array of user tags
         * https://github.com/SteamDatabase/SteamTracking/blob/590b40f75e2ed3a1a314f64448d466a812b6a686/store.steampowered.com/public/javascript/app_tagging.js#L63
         */
        const userTags = HTMLParser.getArrayVariable<{
            is_reported: boolean,
            name: string
        }>(/\[{"tagid".+}\],\s*(\[{"tagid".+}\])/);
        if (!userTags) { return; }

        const reportedTagNames = new Set();

        for (const tag of userTags) {
            if (tag.is_reported) {
                reportedTagNames.add(tag.name);
            }
        }

        if (reportedTagNames.size === 0) { return; }

        for (const tagNode of yourTags) {
            if (reportedTagNames.has(tagNode.textContent!.trim())) {
                tagNode.remove();
            }
        }

        // trigger displaying additional popular tags
        DOMHelper.insertScript("scriptlets/Store/App/triggerResize.js");
    }
}
