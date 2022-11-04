import {Feature} from "../../../Modules/Feature/Feature";
import {Page} from "../../Page";

export default class FPatchHighlightPlayer extends Feature {

    apply() {

        // This aims to fix volume issues with the highlight player, see #1492
        Page.runInPageContext(() => {
            const f = window.SteamFacade;

            // https://github.com/SteamDatabase/SteamTracking/blob/a100fdc357bb6fe4131dc7eb7fa8e17ac4ae10a4/store.steampowered.com/public/javascript/gamehighlightplayer.js#L68
            if (typeof f.global("SetGameHighlightPlayerVolume") === "function") {
                f.globalSet("SetGameHighlightPlayerVolume", (flVolume) => {
                    const dateExpires = new Date();
                    dateExpires.setTime(dateExpires.getTime() + (1000 * 60 * 60 * 24 * 365 * 10));
                    document.cookie = `flGameHighlightPlayerVolume=${flVolume}; expires=${dateExpires.toUTCString()}; path=/`;
                });
            }

            // https://github.com/SteamDatabase/SteamTracking/blob/a100fdc357bb6fe4131dc7eb7fa8e17ac4ae10a4/store.steampowered.com/public/javascript/gamehighlightplayer.js#L33
            if (typeof f.global("BIsUserGameHighlightAudioEnabled") === "function") {
                f.globalSet("BIsUserGameHighlightAudioEnabled", () => {
                    const rgMatches = document.cookie.match(/(^|; )bGameHighlightAudioEnabled=([^;]*)/);
                    return rgMatches && rgMatches[2] === "true";
                });
            }

            // https://github.com/SteamDatabase/SteamTracking/blob/a100fdc357bb6fe4131dc7eb7fa8e17ac4ae10a4/store.steampowered.com/public/javascript/gamehighlightplayer.js#L46
            if (typeof f.global("SetGameHighlightAudioEnabled") === "function") {
                f.globalSet("SetGameHighlightAudioEnabled", (bEnabled) => {
                    const dateExpires = new Date();
                    dateExpires.setTime(dateExpires.getTime() + (1000 * 60 * 60 * 24 * 365 * 10));
                    document.cookie = `bGameHighlightAudioEnabled=${bEnabled ? "true" : "false"}; expires=${dateExpires.toUTCString()}; path=/`;
                });
            }
        });
    }
}
