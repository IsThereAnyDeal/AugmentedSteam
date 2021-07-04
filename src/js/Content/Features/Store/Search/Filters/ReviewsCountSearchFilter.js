import {Localization} from "../../../../../Core/Localization/Localization";
import {SearchFilter} from "./SearchFilter";

export class ReviewsCountSearchFilter extends SearchFilter {

    constructor(feature) {
        super("as-reviews-count", feature);

        this._val = null;
    }

    get active() {
        return this._minCount.value || this._maxCount.value;
    }

    getHTML() {

        return `<div class="as-filter">
                    <div class="as-filter__header">${Localization.str.search_filters.reviews_count.count}</div>
                    <div class="as-filter__content js-reviews-count-filter">
                        <input class="as-filter__input js-reviews-count-input js-reviews-count-lower" type="number" min="0" step="100" placeholder="${Localization.str.search_filters.reviews_count.min_count}">
                        -
                        <input class="as-filter__input js-reviews-count-input js-reviews-count-upper" type="number" min="0" step="100" placeholder="${Localization.str.search_filters.reviews_count.max_count}">
                        <input type="hidden" name="as-reviews-count">
                    </div>
                </div>`;
    }

    setup(params) {

        this._minCount = document.querySelector(".js-reviews-count-lower");
        this._maxCount = document.querySelector(".js-reviews-count-upper");

        for (const input of document.querySelectorAll(".js-reviews-count-input")) {

            input.addEventListener("change", () => {
                this._apply();

                const minVal = this._minCount.value;
                const maxVal = this._maxCount.value;
                let val = null;

                if ((minVal && Number(minVal) !== 0) || maxVal) {
                    val = `${minVal}-${maxVal}`;
                }

                this.value = val;
            });

            input.addEventListener("keydown", e => {
                if (e.key === "Enter") {

                    // Prevents unnecessary submitting of the advanced search form
                    e.preventDefault();

                    input.dispatchEvent(new Event("change"));
                }
            });
        }

        super.setup(params);
    }

    _setState(params) {

        let lowerCountVal = "";
        let upperCountVal = "";

        if (params.has("as-reviews-count")) {

            const val = params.get("as-reviews-count");
            const match = val.match(/(^\d*)-(\d*)/);

            this._value = val;

            if (match) {
                let [, lower, upper] = match;
                lower = parseInt(lower);
                upper = parseInt(upper);

                if (!isNaN(lower)) {
                    lowerCountVal = lower;
                }
                if (!isNaN(upper)) {
                    upperCountVal = upper;
                }
            }
        }

        if (lowerCountVal !== this._minCount.value) {
            this._minCount.value = lowerCountVal;
        }
        if (upperCountVal !== this._maxCount.value) {
            this._maxCount.value = upperCountVal;
        }
    }

    _addRowMetadata(rows = document.querySelectorAll(".search_result_row:not([data-as-review-count])")) {

        for (const row of rows) {
            let reviewCount = 0;

            const reviewsNode = row.querySelector(".search_review_summary");
            if (reviewsNode) {
                const match = reviewsNode.dataset.tooltipHtml.match(/\d{1,3}%.*?((?:\d{1,3},?)+)/);
                if (match) {
                    reviewCount = Number(match[1].replace(/,/g, ""));
                }
            }

            row.dataset.asReviewCount = reviewCount;
        }
    }

    _apply(rows = document.querySelectorAll(".search_result_row")) {

        const minCount = Number(this._minCount.value);
        const maxCount = this._maxCount.value === "" ? Infinity : Number(this._maxCount.value);

        for (const row of rows) {
            const rowCount = Number(row.dataset.asReviewCount);
            row.classList.toggle("as-reviews-count", rowCount < minCount || rowCount > maxCount);
        }
    }
}
