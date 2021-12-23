import {Feature, Messenger} from "../../../modulesContent";
import {LocalStorage} from "../../../../modulesCore";
import {Page} from "../../Page";

export default class FSaveReviewFilters extends Feature {

    apply() {

        Messenger.addMessageListener("filtersChanged", () => {
            LocalStorage.set("review_filters", {
                "context": document.querySelector("#review_context").value,
                "language": document.querySelector("input[name=review_language]:checked").id,
                "minPlaytime": document.querySelector("#app_reviews_playtime_range_min").value,
                "maxPlaytime": document.querySelector("#app_reviews_playtime_range_max").value,
            });
        });

        Page.runInPageContext(({context, language, minPlaytime, maxPlaytime}) => {
            const oldShowFilteredReviews = window.ShowFilteredReviews;

            window.ShowFilteredReviews = function() {
                oldShowFilteredReviews();
                window.Messenger.postMessage("filtersChanged");
            };

            const f = window.SteamFacade;
            let filtersChanged = false;

            if (context && context !== "summary") {
                filtersChanged = true;
                document.querySelector("#review_context").value = context;
            }

            if (language && language !== "review_language_mine") {
                filtersChanged = true;
                document.querySelector(`#${language}`).checked = true;
            }

            if ((minPlaytime && minPlaytime !== "0") || (maxPlaytime && maxPlaytime !== "0")) {
                filtersChanged = true;

                const upperBound = 100;

                const min = Number(minPlaytime);

                /**
                 * No maximum means the upper bound, but is stored as 0
                 * https://github.com/SteamDatabase/SteamTracking/blob/9c64b223ab168c4ce4dacf14fccc3e527f5975ef/store.steampowered.com/public/javascript/game.js#L1651
                 */
                const max = Number(maxPlaytime);

                // Update playtime silder text and hidden inputs (required, the rest are just for visuals)
                f.updatePlaytimeFilterValues(min, max);

                /**
                 * Update playtime preset checkbox state
                 * https://github.com/SteamDatabase/SteamTracking/blob/9c64b223ab168c4ce4dacf14fccc3e527f5975ef/store.steampowered.com/public/javascript/game.js#L1594
                 */
                if (min === 0 && max === 0) {
                    document.querySelector("#review_playtime_preset_0").checked = true;
                } else {
                    f.jq("input[name=review_playtime_preset]").attr("checked", false); // uncheck all radio buttons
                }

                /**
                 * Update playtime slider display
                 * https://github.com/SteamDatabase/SteamTracking/blob/9c64b223ab168c4ce4dacf14fccc3e527f5975ef/store.steampowered.com/public/javascript/game.js#L1608
                 */
                f.jq("#app_reviews_playtime_slider").slider("values", 0, min * 60 * 60);
                f.jq("#app_reviews_playtime_slider").slider("values", 1, (max || upperBound) * 60 * 60);
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
        }, [LocalStorage.get("review_filters")]);
    }
}
