import {Localization} from "../../../../../Core/Localization/Localization";
import {SearchFilter} from "./SearchFilter";

export class ReviewsScoreSearchFilter extends SearchFilter {

    constructor(feature) {
        super("as-reviews-score", feature);

        this._stepSize = 5;

        this._scoreValues = [];
        for (let score = 0; score < 100; score += this._stepSize) {
            this._scoreValues.push(score);
        }
        this._maxStep = this._scoreValues.length;
        this._active = false;
    }

    get active() {
        return this._active;
    }

    set active(newActive) {
        this._feature.results.classList.toggle("reviews-score", newActive);
        this._active = newActive;
    }

    getHTML() {
        return `<div><input type="hidden" name="as-hide"></div>
                <div class="block_rule"></div>
                <div class="range_container" style="margin-top: 8px;">
                    <div class="as-double-slider js-reviews-score-filter range_container_inner">
                        <input class="as-double-slider__input as-double-slider__input--upper js-reviews-score-input js-reviews-score-upper range_input" type="range" min="0" max="${this._maxStep}" step="1" value="${this._maxStep}">
                        <input class="as-double-slider__input as-double-slider__input--lower js-reviews-score-input js-reviews-score-lower range_input" type="range" min="0" max="${this._maxStep}" step="1" value="0">
                        <input type="hidden" name="as-reviews-score">
                    </div>
                    <div class="as-range-display range_display">${Localization.str.search_filters.reviews_score.any}</div>
                </div>`;
    }

    setup(params) {

        this._scoreFilter = document.querySelector(".js-reviews-score-filter");
        this._minScore = this._scoreFilter.querySelector(".js-reviews-score-lower");
        this._maxScore = this._scoreFilter.querySelector(".js-reviews-score-upper");
        this._rangeDisplay = this._scoreFilter.nextElementSibling;

        for (const input of document.querySelectorAll(".js-reviews-score-input")) {

            let minVal = parseInt(this._minScore.value);
            let maxVal = parseInt(this._maxScore.value);

            input.addEventListener("input", () => {

                const maxStep = this._maxStep;

                minVal = parseInt(this._minScore.value);
                maxVal = parseInt(this._maxScore.value);

                if (input === this._maxScore) {
                    if (minVal >= maxVal) {
                        if (minVal <= 0) {
                            this._maxScore.value = 1;
                            maxVal = 1;
                        } else {
                            this._minScore.value = maxVal - 1;
                            minVal = maxVal - 1;
                        }
                    }
                } else if (maxVal <= minVal) {

                    // Happens when the user clicks to the highest step after the max thumb instead of dragging
                    if (minVal === maxStep) {
                        this._minScore.value = maxStep - 1;
                        minVal = maxStep - 1;

                        this._maxScore.value = maxStep;
                        maxVal = maxStep;
                    } else if (maxVal < maxStep) {
                        this._maxScore.value = minVal + 1;
                        maxVal = minVal + 1;
                    } else {
                        this._minScore.value = maxVal - 1;
                        minVal = maxVal - 1;
                    }
                }

                let text;
                if (minVal === 0) {
                    if (maxVal === maxStep) {
                        text = Localization.str.search_filters.reviews_score.any;
                    } else {
                        text = Localization.str.search_filters.reviews_score.up_to.replace("__score__", this._scoreValues[maxVal]);
                    }
                } else if (maxVal === maxStep) {
                    text = Localization.str.search_filters.reviews_score.from
                        .replace("__score__", this._scoreValues[minVal]);
                } else {
                    text = Localization.str.search_filters.reviews_score.between
                        .replace("__lower__", this._scoreValues[minVal])
                        .replace("__upper__", this._scoreValues[maxVal]);
                }

                this._rangeDisplay.textContent = text;
            });

            input.addEventListener("change", () => {

                const active = minVal !== 0 || maxVal !== this._maxStep;
                const val = active ? `${minVal === 0 ? "" : this._scoreValues[minVal]}-${maxVal === this._maxStep ? "" : this._scoreValues[maxVal]}` : null;

                this.value = val;
                this.active = active;

                this._apply();
            });
        }

        super.setup(params);
    }

    _setState(params) {

        let lowerScoreVal = "0";
        let upperScoreVal = this._maxStep.toString();

        if (params.has("as-reviews-score")) {

            const val = params.get("as-reviews-score");
            const match = val.match(/(^\d*)-(\d*)/);

            this._value = val;

            if (match) {
                let [, lower, upper] = match;
                lower = parseInt(lower);
                upper = parseInt(upper);

                if (!isNaN(lower) && this._scoreValues.includes(lower)) {
                    lowerScoreVal = this._scoreValues.indexOf(lower).toString();
                }
                if (!isNaN(upper) && this._scoreValues.includes(upper)) {
                    upperScoreVal = this._scoreValues.indexOf(upper).toString();
                }
            }
        }

        this._minScore.value = lowerScoreVal;
        this._maxScore.value = upperScoreVal;
    }

    _addRowMetadata(rows = document.querySelectorAll(".search_result_row:not([data-as-review-percentage])")) {

        for (const row of rows) {
            let reviewPercentage = -1;

            const reviewsNode = row.querySelector(".search_review_summary");
            if (reviewsNode) {
                const match = reviewsNode.dataset.tooltipHtml.match(/(?<=%\s?)\d+|\d+(?=\s*%)/);
                if (match) {
                    reviewPercentage = Number(match[0]);
                }
            }

            row.dataset.asReviewPercentage = reviewPercentage;
        }
    }

    _apply(rows = document.querySelectorAll(".search_result_row")) {

        if (!this.active) { return; }

        const minScore = this._scoreValues[Number(this._minScore.value)];

        const maxVal = Number(this._maxScore.value);
        const maxScore = maxVal === this._maxStep ? Infinity : this._scoreValues[maxVal];

        for (const row of rows) {
            const rowScore = Number(row.dataset.asReviewPercentage);
            row.classList.toggle("as-reviews-score", rowScore === -1 || rowScore < minScore || rowScore > maxScore);
        }
    }
}
