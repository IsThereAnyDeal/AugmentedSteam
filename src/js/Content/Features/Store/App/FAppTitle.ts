import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";

/**
 * Prepends app name to the document <title> if it doesn't already start with app name
 */
export default class FAppTitle extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.tabtitle_appname_first;
    }

    override async apply(): Promise<void> {
        const appName = this.context.appName;
        if (!document.title.startsWith(appName)) {
            document.title = appName + " - " + document.title;
        }
    }
}
