import Feature from "@Content/Modules/Context/Feature";
import type CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FSkipGotSteamDialog extends Feature<CStoreBase> {

    override checkPrerequisites(): boolean {
        return Settings.skip_got_steam;
    }

    override apply(): void {
        // https://github.com/SteamDatabase/SteamTracking/blob/cdf367ce61926a896fe54d710b3ed25d66d7e333/store.steampowered.com/public/javascript/game.js#L1785
        DOMHelper.insertScript("scriptlets/Store/Common/skipGotSteamDialog.js");
    }
}
