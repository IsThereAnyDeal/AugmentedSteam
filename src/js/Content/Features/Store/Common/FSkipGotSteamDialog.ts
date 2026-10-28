import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import type Context from "@Content/Modules/Context/Context";

export default class FSkipGotSteamDialog extends Feature<Context> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.skip_got_steam;
    }

    override async apply(): Promise<void> {
        // https://github.com/SteamDatabase/SteamTracking/blob/cdf367ce61926a896fe54d710b3ed25d66d7e333/store.steampowered.com/public/javascript/game.js#L1785
        DOMHelper.insertScript("scriptlets/Store/Common/skipGotSteamDialog.js");
    }
}
