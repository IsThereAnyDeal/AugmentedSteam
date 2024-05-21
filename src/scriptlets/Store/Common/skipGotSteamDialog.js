(function(){
    // https://github.com/SteamDatabase/SteamTracking/blob/cdf367ce61926a896fe54d710b3ed25d66d7e333/store.steampowered.com/public/javascript/game.js#L1785
    window.ShowGotSteamModal = (steamUrl) => {
        window.location.assign(steamUrl);
    };
})();
