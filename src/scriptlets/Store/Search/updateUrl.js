(function(){
    const params = JSON.parse(document.currentScript.dataset.params);

    // https://github.com/SteamDatabase/SteamTracking/blob/a4cdd621a781f2c95d75edecb35c72f6781c01cf/store.steampowered.com/public/javascript/searchpage.js#L217
    UpdateUrl(params.params);
})();
