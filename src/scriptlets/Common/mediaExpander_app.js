(function(){
    window.AdjustVisibleAppTags($J(".popular_tags"));

    /*
     * Triggers the adjustment of the slider scroll bar.
     * https://github.com/SteamDatabase/SteamTracking/blob/ad4e85261f2322eae0b0125e46d7d753bf755730/store.steampowered.com/public/javascript/gamehighlightplayer.js#L101
     */
    $J(window).trigger("resize.GameHighlightPlayer");
})();
