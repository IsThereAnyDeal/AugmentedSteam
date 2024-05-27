(function(){
    /*
     * The handler set by this function is triggered when the page that infiniscroll will display has changed
     * https://github.com/SteamDatabase/SteamTracking/blob/71f26599625ed8b6af3c0e8968c3959405fab5ec/store.steampowered.com/public/javascript/searchpage.js#L614
     */
    function setPageChangeHandler() {
        const controller = InitInfiniteScroll.oController;
        if (controller) {
            const oldPageHandler = controller.m_fnPageChangedHandler;

            controller.SetPageChangedHandler((...args) => {
                oldPageHandler(...args);

                document.dispatchEvent(new CustomEvent("searchCompleted", {detail: false}));
            });
        }
    }

    // https://github.com/SteamDatabase/SteamTracking/blob/8a120c6dc568670d718f077c735b321a1ac80a29/store.steampowered.com/public/javascript/searchpage.js#L264
    const searchOld = window.ExecuteSearch;

    window.ExecuteSearch = function(params) {

        /*
         * The ExecuteSearch function uses the global object g_rgCurrentParameters, that is
         * filled by GatherSearchParameters(), and compares it to the new search parameters
         * (the object passed to this function).
         * If it detects that the two objects are different, it triggers a search request.
         * Since the AS filters are all clientside, we don't want to do that and remove
         * our added entries from the objects here.
         * https://github.com/SteamDatabase/SteamTracking/blob/8a120c6dc568670d718f077c735b321a1ac80a29/store.steampowered.com/public/javascript/searchpage.js#L273
         */

        const paramsCopy = {};
        Object.assign(paramsCopy, params);

        const currentAsParameters = {};
        const asParameters = {};

        for (const filter in g_rgCurrentParameters) {
            if (filter.startsWith("as-")) {
                currentAsParameters[filter] = g_rgCurrentParameters[filter];
                delete g_rgCurrentParameters[filter];
            }
        }

        for (const filter in params) {
            if (filter.startsWith("as-")) {
                asParameters[filter] = params[filter];
                delete params[filter];
            }
        }

        /*
         * If our parameters have changed (this automatically means theirs have not, since
         * during different states there is only one change in parameters), there won't be new results.
         * Therefore we can already notify the content script that the search completed.
         */
        if (Object.toQueryString(currentAsParameters) !== Object.toQueryString(asParameters)) {
            document.dispatchEvent(new CustomEvent("searchCompleted", {detail: true}));
        }

        searchOld(params);

        // Restore state such that the next comparison includes AS filters
        g_rgCurrentParameters = paramsCopy;
    };

    // https://github.com/SteamDatabase/SteamTracking/blob/8a120c6dc568670d718f077c735b321a1ac80a29/store.steampowered.com/public/javascript/searchpage.js#L298
    const searchCompletedOld = window.SearchCompleted;

    window.SearchCompleted = function(...args) {
        searchCompletedOld(...args);

        // https://github.com/SteamDatabase/SteamTracking/blob/71f26599625ed8b6af3c0e8968c3959405fab5ec/store.steampowered.com/public/javascript/searchpage.js#L319
        setPageChangeHandler();

        // At this point the new results have been loaded and decorated (by the Dynamic Store)
        document.dispatchEvent(new CustomEvent("searchCompleted", {detail: false}));
    };

    // https://github.com/SteamDatabase/SteamTracking/blob/71f26599625ed8b6af3c0e8968c3959405fab5ec/store.steampowered.com/public/javascript/searchpage.js#L463
    setPageChangeHandler();
})();
