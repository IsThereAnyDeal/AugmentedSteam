import Feature from "@Content/Modules/Context/Feature";
import type CProfileActivity from "@Content/Features/Community/ProfileActivity/CProfileActivity";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FPatchBlotterFunc extends Feature<CProfileActivity> {

    override apply(): void {
        DOMHelper.insertScript("scriptlets/Community/ProfileActivity/patchBlotter.js");
    }
}
