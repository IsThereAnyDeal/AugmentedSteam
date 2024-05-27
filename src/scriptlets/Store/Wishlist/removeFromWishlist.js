(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const appid = params.appid;

    // https://github.com/SteamDatabase/SteamTracking/blob/161d053dc7bd782333584196d97bce5f7509d640/store.steampowered.com/public/javascript/wishlist.js#L158
    RemoveFromWishlist(appid);

    $J("#wishlist_ctn").removeClass("sorting");

    delete g_rgAppInfo[appid];
    g_Wishlist.rgAllApps = Object.keys(g_rgAppInfo);
    g_Wishlist.Update(true);
})();
