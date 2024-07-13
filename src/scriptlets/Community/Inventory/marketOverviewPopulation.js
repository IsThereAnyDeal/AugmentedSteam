(function() {
    function onComplete(response) {
        const params = JSON.parse(document.currentScript.dataset.params);
        const {hashName} = params;

        // Wait for population of the div https://github.com/SteamDatabase/SteamTracking/blob/6c5145935aa0a9f9134e724d89569dfd1f2af014/steamcommunity.com/public/javascript/economy_v2.js#L3563
        if (!response.url.startsWith("https://steamcommunity.com/market/priceoverview/")
            || response.parameters.market_hash_name !== hashName
        ) {
            return;
        }

        document.dispatchEvent(new CustomEvent("as_marketOverviewPopulation"));
        window.Ajax.Responders.unregister(onComplete);
    }

    window.Ajax.Responders.register({onComplete});
})();
