import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";
import {Feature} from "../../../Modules/Feature/Feature";
import {Page} from "../../Page";

export default class FSkipGotSteamDialog extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("skip_got_steam");
    }

    apply() {

        // https://github.com/SteamDatabase/SteamTracking/blob/cdf367ce61926a896fe54d710b3ed25d66d7e333/store.steampowered.com/public/javascript/game.js#L1785
        Page.runInPageContext(() => {
            window.SteamFacade.globalSet("ShowGotSteamModal", (steamUrl) => {
                window.location.assign(steamUrl);
            });
        });
    }
}
