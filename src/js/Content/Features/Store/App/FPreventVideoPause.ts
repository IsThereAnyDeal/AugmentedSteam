import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";

/**
 * Prevent videos pausing when switching tabs or tab losing focus in general
 */
export default class FPreventVideoPause extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.prevent_video_pause;
    }

    override apply(): void {
        DOMHelper.insertScript("scriptlets/Store/App/preventVideoPauseScriptlet.js");
    }
}
