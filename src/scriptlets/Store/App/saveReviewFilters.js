(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {context, language, minPlaytime, maxPlaytime} = params;

    const oldShowFilteredReviews = window.ShowFilteredReviews;

    window.ShowFilteredReviews = function() {
        oldShowFilteredReviews();
        document.dispatchEvent(new CustomEvent("as_filtersChanged"));
    };

    let filtersChanged = false;

    if (context && context !== "review_context_summary") {
        const input = document.querySelector(`#${context}`);
        if (input) {
            filtersChanged = true;
            input.checked = true;
        }
    }

    if (language && language !== "review_language_mine") {
        const input = document.querySelector(`#${language}`);
        if (input) {
            filtersChanged = true;
            input.checked = true;
        }
    }

    // Playtime filters may not be available on apps with too few reviews
    if (document.querySelector("#app_reviews_playtime_range_min") !== null
        && ((minPlaytime && minPlaytime !== "0") || (maxPlaytime && maxPlaytime !== "0"))
    ) {
        filtersChanged = true;

        const upperBound = 100;

        const min = Number(minPlaytime);

        /**
         * No maximum means the upper bound, but is stored as 0
         * https://github.com/SteamDatabase/SteamTracking/blob/9c64b223ab168c4ce4dacf14fccc3e527f5975ef/store.steampowered.com/public/javascript/game.js#L1651
         */
        const max = Number(maxPlaytime);

        // Update playtime silder text and hidden inputs (required, the rest are just for visuals)
        UpdatePlaytimeFilterValues(min, max);

        /**
         * Update playtime preset checkbox state
         * https://github.com/SteamDatabase/SteamTracking/blob/9c64b223ab168c4ce4dacf14fccc3e527f5975ef/store.steampowered.com/public/javascript/game.js#L1594
         */
        $J("input[name=review_playtime_preset]").attr("checked", false); // uncheck all radio buttons

        if (max === 0) {
            $J(`#review_playtime_preset_${min}`).attr("checked", true);
        }

        /**
         * Update playtime slider display
         * https://github.com/SteamDatabase/SteamTracking/blob/9c64b223ab168c4ce4dacf14fccc3e527f5975ef/store.steampowered.com/public/javascript/game.js#L1608
         */
        $J("#app_reviews_playtime_slider").slider("values", 0, min * 60 * 60);
        $J("#app_reviews_playtime_slider").slider("values", 1, (max || upperBound) * 60 * 60);
    }

    if (!filtersChanged) { return; }

    const loadingEl = document.querySelector("#Reviews_loading");

    // Refresh displayed reviews if our script is ran after reviews have started loading
    if (loadingEl.style.display === "none") {
        oldShowFilteredReviews();
    } else if (loadingEl.style.display === "block") {
        new MutationObserver((mutations, observer) => {
            observer.disconnect();
            oldShowFilteredReviews();
        }).observe(loadingEl, {"attributes": true});
    }
})();
