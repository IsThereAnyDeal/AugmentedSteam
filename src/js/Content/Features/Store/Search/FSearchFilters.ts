import {__filters} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CSearch from "@Content/Features/Store/Search/CSearch";
import type SearchFilter from "@Content/Features/Store/Search/Filters/SearchFilter";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import CartSearchFilter from "@Content/Features/Store/Search/Filters/CartSearchFilter";
import EarlyAccessSearchFilter from "@Content/Features/Store/Search/Filters/EarlyAccessSearchFilter";
import MixedSearchFilter from "@Content/Features/Store/Search/Filters/MixedSearchFilter";
import NegativeSearchFilter from "@Content/Features/Store/Search/Filters/NegativeSearchFilter";
import ReviewsScoreSearchFilter from "@Content/Features/Store/Search/Filters/ReviewsScoreSearchFilter";
import ReviewsCountSearchFilter from "@Content/Features/Store/Search/Filters/ReviewsCountSearchFilter";
import DiscountPercentSearchFilter from "@Content/Features/Store/Search/Filters/DiscountPercentSearchFilter";
import DOMHelper from "@Content/Modules/DOMHelper";
import EarlyAccessUtils from "@Content/Modules/EarlyAccess/EarlyAccessUtils";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";

export default class FSearchFilters extends Feature<CSearch> {

    private _filters: SearchFilter[] = [];
    private _urlParams: Record<string, SearchFilter[]> = {};
    public results: HTMLElement|null = null;

    private _filterValues: Array<[string, string]> = [];

    override apply(): void {

        this._filters = [
            CartSearchFilter,
            EarlyAccessSearchFilter,
            MixedSearchFilter,
            NegativeSearchFilter,
            ReviewsScoreSearchFilter,
            ReviewsCountSearchFilter,
            DiscountPercentSearchFilter
        ].map(Filter => new Filter(this));

        this._urlParams = {};

        for (const filter of this._filters) {
            const param = filter.urlParam;

            if (this._urlParams[param]) {
                this._urlParams[param]!.push(filter);
            } else {
                this._urlParams[param] = [filter];
            }
        }

        this.results = document.querySelector("#search_results");

        const collapseName = "augmented_steam";

        HTML.afterBegin("#advsearchform .rightcol",
            `<div class="block search_collapse_block" data-collapse-name="${collapseName}">
                <div class="block_header"><div>${L(__filters)}</div></div>
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
        DOMHelper.insertScript("scriptlets/Store/Search/addCollapseHandlers.js", {
            collapseName,
            shouldCollapse: this._filters.every(filter => !filter.active)
        });

        this._observeChanges();
    }

    private _observeChanges(): void {

        // @ts-ignore
        document.addEventListener("searchCompleted", (e: CustomEvent<boolean>) => {
            const filtersChanged = e.detail;
            const newResults = document.querySelectorAll<HTMLElement>(".search_result_row:not([data-as-review-count])");

            EarlyAccessUtils.show(this.context.language, newResults);
            HighlightsTagsUtils.highlightAndTag(newResults);

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
        })

        DOMHelper.insertScript("scriptlets/Store/Search/executeSearchOverride.js");
    }

    private _updateFilterValues(): void {
        this._filterValues = Object.entries(this._urlParams).map(([param, filters]) => {
            const value = filters
                .map(filter => filter.value)
                .filter(val => val !== null)
                .join(",");

            return [param, value];
        });
    }

    public updateURLs(): void {
        this._updateFilterValues();

        const curParams = new URLSearchParams(window.location.search);

        for (const [param, value] of this._filterValues) {

            /*
             * This hidden input is required for GatherSearchParameters,
             * otherwise AS' inputs are not considered when selecting another Steam native filter.
             * https://github.com/SteamDatabase/SteamTracking/blob/1dfdbd838714d4b868e0221ca812696ca05f0a6b/store.steampowered.com/public/javascript/searchpage.js#L177
             */
            (<HTMLInputElement>document.getElementsByName(param)[0]).value = value;
        }

        // Update the current URL
        this._modifyParams(curParams, this._filterValues);

        DOMHelper.insertScript("scriptlets/Store/Search/updateUrl.js", {
            params: this._paramsToObject(curParams)
        });
        this._modifyPageLinks();
    }

    private _modifyPageLinks(): void {
        if (this.context.infiniScrollEnabled) { return; }

        for (const linkElement of document.querySelectorAll<HTMLAnchorElement>(".search_pagination_right a")) {

            const url = new URL(linkElement.href);
            const params = url.searchParams;

            this._modifyParams(params, this._filterValues);

            /*
             * We can't simply use URLSearchParams.prototype.toString here, since existing query string parameters
             * would be modified when stringifying back again (e.g. "white%20space" will turn into "white+space" and break links).
             * Therefore the URLSearchParameters are converted to an object and parsed by Prototype's Object.toQueryString.
             */

            (new Promise<string>(resolve => {
                // @ts-ignore
                document.addEventListener("as_queryString", (e: CustomEvent<string>) => {
                    resolve(e.detail);
                }, {once: true});

                DOMHelper.insertScript("scriptlets/Search/toQueryString.js", this._paramsToObject(params))
            })).then(queryString => {
                url.search = `?${queryString}`;
                linkElement.href = url.href;
            });
        }
    }

    private _modifyParams(searchParams: URLSearchParams, entries: Array<[string, string]>) {
        for (const [key, val] of entries) {
            if (val !== "" && val !== null) {
                searchParams.set(key, val);
            } else {
                searchParams.delete(key);
            }
        }
    }

    private _paramsToObject(params: URLSearchParams): Record<string, string> {
        const paramsObj: Record<string, string> = {};
        for (const [key, val] of params) {
            paramsObj[key] = val;
        }
        return paramsObj;
    }
}
