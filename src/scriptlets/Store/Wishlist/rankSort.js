(function(){
    const globalAppInfo = window.g_rgAppInfo;
    const wishlist = window.g_Wishlist;
    const controller = window.CWishlistController.prototype;

    function sortByRank() {
        // Source: https://github.com/SteamDatabase/SteamTracking/blob/2ffc58d15afb8d7d25747ff32b0bf44032c36ad4/store.steampowered.com/public/javascript/wishlist.js#L784
        return Array.from(wishlist.rgAllApps).sort((a, b) => {
            if (globalAppInfo[b].priority === globalAppInfo[a].priority) { return 0; }
            if (globalAppInfo[b].priority === 0) { return -1; }
            if (globalAppInfo[a].priority === 0) { return 1; }
            return globalAppInfo[a].priority - globalAppInfo[b].priority;
        });
    }

    for (const fnName of ["MoveToPosition", "SaveOrder"]) {
        const oldFn = controller[fnName];

        /*
         * MoveToPosition and SaveOrder assume that rgAllApps is sorted by "Your rank".
         * Otherwise, the ranking would be overwritten by the currently displayed order,
         * see https://github.com/IsThereAnyDeal/AugmentedSteam/issues/1293
         */
        controller[fnName] = function(...args) {
            oldFn.call(Object.assign(wishlist, {"rgAllApps": sortByRank()}), ...args);
        };
    }
})();
