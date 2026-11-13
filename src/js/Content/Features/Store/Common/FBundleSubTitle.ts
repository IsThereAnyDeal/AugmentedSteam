import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type Context from "@Content/Modules/Context/Context";

/**
 * Prepends bundle or package name to the document <title> if it doesn't already start with it.
 * Should work on both /bundle/ and /sub/ pages, since those seem to be the same
 */
export default class FBundleSubTitle extends Feature<Context> {

    override async isEnabled(): Promise<boolean> {
        return Settings.tabtitle_appname_first;
    }

    override async apply(): Promise<string|null> {
        const pageHeader = document.querySelector("h2.pageheader");
        if (!pageHeader) {
            return "Didn't find title";
        }

        const title = pageHeader.textContent.trim();

        if (!document.title.startsWith(title)) {
            document.title = title + " - " + document.title;
        }
        return null;
    }
}
