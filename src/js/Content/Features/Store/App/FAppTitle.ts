import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";

export default class FAppTitle extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.tabtitle_appname_first;
    }

    override apply(): void {
        const appName = this.context.appName;
        if (!document.title.startsWith(appName)) {
            document.title = appName + " - " + document.title;
        }
    }
}
