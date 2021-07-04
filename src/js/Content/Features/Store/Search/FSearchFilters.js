import {HTML, Language, Localization} from "../../../../modulesCore";
import {EarlyAccess, Feature, Messenger} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";
import {Page} from "../../Page";
import {CartSearchFilter} from "./Filters/CartSearchFilter";
import {EarlyAccessSearchFilter} from "./Filters/EarlyAccessSearchFilter";
import {MixedSearchFilter} from "./Filters/MixedSearchFilter";
import {NegativeSearchFilter} from "./Filters/NegativeSearchFilter";
import {ReviewsCountSearchFilter} from "./Filters/ReviewsCountSearchFilter";
import {ReviewsScoreSearchFilter} from "./Filters/ReviewsScoreSearchFilter";
import {ReleaseDateSearchFilter} from "./Filters/ReleaseDateSearchFilter";

export default class FSearchFilters extends Feature {

    apply() {

        this._filters = [
            CartSearchFilter,
            EarlyAccessSearchFilter,
            MixedSearchFilter,
            NegativeSearchFilter,
            ReviewsScoreSearchFilter,
            ReviewsCountSearchFilter,
        ];

        // Only support this filter with english dates
        if (Language.getCurrentSteamLanguage() === "english") {
            // TODO: Multilang support?
            this._filters.push(ReleaseDateSearchFilter);
        }
        
        this._filters = this._filters.map(Filter => new Filter(this));
        this._urlParams = {};

        for (const filter of this._filters) {
            const param = filter.urlParam;

            if (this._urlParams[param]) {
                this._urlParams[param].push(filter);
            } else {
                this._urlParams[param] = [filter];
            }
        }

        this.results = document.getElementById("search_results");

        const collapseName = "augmented_steam";

        HTML.afterBegin("#advsearchform .rightcol",
            `<div class="block search_collapse_block" data-collapse-name="${collapseName}">
                <div class="block_header"><div>${Localization.str.filters}</div></div>
                <div class="block_content block_content_inner">
                    ${this._filters.reduce((html, filter) => html + filter.getHTML(), "")}
                </div>
            </div>`);

        const params = new URLSearchParams(window.location.search);

        for (const filter of this._filters) {
            filter.setup(params);
        }

        this._updateFilterValues();
        this._modifyPageLinks();

        window.addEventListener("popstate", () => {

            const params = new URLSearchParams(window.location.search);

            for (const filter of this._filters) {
                filter._setState(params);
            }

            this._updateFilterValues();
        });

        // Allow user to autocollapse the added category block just like any other
        Page.runInPageContext((collapseName, shouldCollapse) => {
            /* eslint-disable new-cap, no-undef */

            /*
             * https://github.com/SteamDatabase/SteamTracking/blob/a4cdd621a781f2c95d75edecb35c72f6781c01cf/store.steampowered.com/public/javascript/searchpage.js#L927
             * InitAutocollapse
             */
            const prefs = GetCollapsePrefs();

            const block = window.SteamFacade.jq(`.search_collapse_block[data-collapse-name="${collapseName}"]`);
            let collapsed;

            if (typeof prefs[collapseName] === "undefined") {
                prefs[collapseName] = false;
                collapsed = false;
            } else {
                collapsed = prefs[collapseName];
            }

            collapsed = collapsed && shouldCollapse;

            block.children(".block_content").css("height", "");

            if (collapsed) {
                block.addClass("collapsed");
                block.children(".block_content").hide();
            }

            block.children(".block_header").on("click", () => {
                if (block.hasClass("collapsed")) {
                    prefs[collapseName] = false;
                    block.children(".block_content").slideDown("fast");
                } else {
                    prefs[collapseName] = true;
                    block.children(".block_content").slideUp("fast");
                }

                block.toggleClass("collapsed");
                SaveCollapsePrefs(prefs);
            });
            /* eslint-enable new-cap, no-undef */
        }, [collapseName, this._filters.every(filter => !filter.active)]);

        this._observeChanges();
    }

    _observeChanges() {

        Messenger.addMessageListener("searchCompleted", filtersChanged => {
            const newResults = document.querySelectorAll(".search_result_row:not([data-as-review-count])");

            EarlyAccess.showEarlyAccess();
            FHighlightsTags.highlightAndTag(newResults);

            const params = new URLSearchParams(window.location.search);

            for (const filter of this._filters) {

                filter._addRowMetadata(newResults);

                if (filtersChanged) {
                    filter._setState(params);
                    filter._apply(document.querySelectorAll(".search_result_row"));
                } else {
                    filter._apply(newResults);
                }
            }

            this._updateFilterValues();
            this._modifyPageLinks();
        });

        Page.runInPageContext(() => {
            /* eslint-disable new-cap, no-undef, camelcase */

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

                        window.Messenger.postMessage("searchCompleted", false);
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
                    window.Messenger.postMessage("searchCompleted", true);
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
                window.Messenger.postMessage("searchCompleted", false);
            };

            // https://github.com/SteamDatabase/SteamTracking/blob/71f26599625ed8b6af3c0e8968c3959405fab5ec/store.steampowered.com/public/javascript/searchpage.js#L463
            setPageChangeHandler();
            /* eslint-disable new-cap, no-undef, camelcase */
        });
    }

    _updateFilterValues() {
        this._filterValues = Object.entries(this._urlParams).map(([param, filters]) => {
            const value = filters
                .map(filter => filter.value)
                .filter(val => val !== null)
                .join(",");

            return [param, value];
        });
    }

    updateURLs() {

        this._updateFilterValues();

        const curParams = new URLSearchParams(window.location.search);

        for (const [param, value] of this._filterValues) {

            /*
             * This hidden input is required for GatherSearchParameters,
             * otherwise AS' inputs are not considered when selecting another Steam native filter.
             * https://github.com/SteamDatabase/SteamTracking/blob/1dfdbd838714d4b868e0221ca812696ca05f0a6b/store.steampowered.com/public/javascript/searchpage.js#L177
             */
            document.getElementsByName(param)[0].value = value;
        }

        // Update the current URL
        this._modifyParams(curParams, this._filterValues);

        Page.runInPageContext(params => {

            // https://github.com/SteamDatabase/SteamTracking/blob/a4cdd621a781f2c95d75edecb35c72f6781c01cf/store.steampowered.com/public/javascript/searchpage.js#L217
            UpdateUrl(params);
        }, [this._paramsToObject(curParams)]);

        this._modifyPageLinks();
    }

    _modifyPageLinks() {

        if (this.context.infiniScrollEnabled) { return; }

        for (const linkElement of document.querySelectorAll(".search_pagination_right a")) {

            const url = new URL(linkElement.href);
            const params = url.searchParams;

            this._modifyParams(params, this._filterValues);

            /*
             * We can't simply use URLSearchParams.prototype.toString here, since existing query string parameters
             * would be modified when stringifying back again (e.g. "white%20space" will turn into "white+space" and break links).
             * Therefore the URLSearchParameters are converted to an object and parsed by Prototype's Object.toQueryString.
             */
            Page.runInPageContext(obj => Object.toQueryString(obj), [this._paramsToObject(params)], true)
                .then(queryString => {
                    url.search = `?${queryString}`;
                    linkElement.href = url.href;
                });
        }
    }

    _modifyParams(searchParams, entries) {
        for (const [key, val] of entries) {
            if (val !== "" && val !== null) {
                searchParams.set(key, val);
            } else {
                searchParams.delete(key);
            }
        }
    }

    _paramsToObject(params) {
        const paramsObj = {};
        for (const [key, val] of params) {
            paramsObj[key] = val;
        }
        return paramsObj;
    }
}
