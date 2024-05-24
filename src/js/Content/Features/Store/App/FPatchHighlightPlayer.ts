import DOMHelper from "@Content/Modules/DOMHelper";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FPatchHighlightPlayer extends Feature<CApp> {

    apply() {
        // This aims to fix volume issues with the highlight player, see #1492
        DOMHelper.insertScript("scriptlets/Store/App/patchHighlightPlayer.js");
    }
}
