(function(){
    /**
     * Remove the check for `g_bUserSelectedTrailer` to avoid unmuting the player when switching or seeking video
     * https://github.com/SteamDatabase/SteamTracking/blob/b7e8996a9a2a26296df60b252a608b3dc1c96ab1/store.steampowered.com/public/javascript/gamehighlightplayer.js#L33
     */
    if (typeof BIsUserGameHighlightAudioEnabled === "function") {

        BIsUserGameHighlightAudioEnabled = () => {
            const rgMatches = document.cookie.match(/(^|; )bGameHighlightAudioEnabled=([^;]*)/);
            return rgMatches && rgMatches[2] === "true";
        };
    }
})();
