import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FRemoveBroadcasts extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.removebroadcasts
            && document.querySelector("[data-featuretarget=broadcast-embed]") !== null;
    }

    override apply(): void {
        document.querySelector("[data-featuretarget=broadcast-embed]")?.remove();
        DOMHelper.insertScript("scriptlets/Store/App/stopBroadcast.js");
    }
}
