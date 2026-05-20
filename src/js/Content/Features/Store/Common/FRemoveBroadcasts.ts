import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";
import type CStoreBase from "@Content/Features/Store/Common/CStoreBase";

export default class FRemoveBroadcasts extends Feature<CStoreBase> {

    override checkPrerequisites(): boolean {
        return Settings.removebroadcasts
            && document.querySelector("[data-featuretarget=broadcast-embed]") !== null;
    }

    override apply(): void {
        document.querySelector("[data-featuretarget=broadcast-embed]")?.remove();
        DOMHelper.insertScript("scriptlets/Store/App/stopBroadcast.js");
    }
}
