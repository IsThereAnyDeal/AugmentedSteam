import {Feature} from "../../../Modules/Feature/Feature";
import {Page} from "../../Page";

export default class FPatchHighlightPlayer extends Feature {

    apply() {

        // This aims to fix volume issues with the highlight player, see #1492
        Page.runInPageContext(() => {
            const f = window.SteamFacade;

            /**
             * Remove the check for `g_bUserSelectedTrailer` to avoid unmuting the player when switching or seeking video
             * https://github.com/SteamDatabase/SteamTracking/blob/b7e8996a9a2a26296df60b252a608b3dc1c96ab1/store.steampowered.com/public/javascript/gamehighlightplayer.js#L33
             */
            if (typeof f.global("BIsUserGameHighlightAudioEnabled") === "function") {

                f.globalSet("BIsUserGameHighlightAudioEnabled", () => {
                    const rgMatches = document.cookie.match(/(^|; )bGameHighlightAudioEnabled=([^;]*)/);
                    return rgMatches && rgMatches[2] === "true";
                });
            }
        });
    }
}
