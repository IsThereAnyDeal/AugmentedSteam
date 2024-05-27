import {
    __searchFilters_reviewsScore_any,
    __searchFilters_reviewsScore_between,
    __searchFilters_reviewsScore_from,
    __searchFilters_reviewsScore_upTo,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import SearchFilter from "./SearchFilter";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";

export default class ReviewsScoreSearchFilter extends SearchFilter {

    private readonly _stepSize: number;
    private readonly _scoreValues: number[];
    private readonly _maxStep: number;
    private _active: boolean;

    private _scoreFilter: HTMLElement|null = null;
    private _minScore: HTMLInputElement|null = null;
    private _maxScore: HTMLInputElement|null = null;
    private _rangeDisplay: HTMLElement|null = null;

    constructor(feature: FSearchFilters) {
        super("as-reviews-score", feature);

        this._stepSize = 5;

        this._scoreValues = [];
        for (let score = 0; score < 100; score += this._stepSize) {
            this._scoreValues.push(score);
        }
        this._maxStep = this._scoreValues.length;
        this._active = false;
    }

    override get active(): boolean {
        return this._active;
    }

    override set active(newActive: boolean) {
        this._feature.results?.classList.toggle("reviews-score", newActive);
        this._active = newActive;
    }

    getHTML(): string {
        return `<div><input type="hidden" name="as-hide"></div>
                <div class="block_rule"></div>
                <div class="range_container" style="margin-top: 8px;">
                    <div class="as-double-slider js-reviews-score-filter range_container_inner">
                        <input class="as-double-slider__input as-double-slider__input--upper js-reviews-score-input js-reviews-score-upper range_input" type="range" min="0" max="${this._maxStep}" step="1" value="${this._maxStep}">
                        <input class="as-double-slider__input as-double-slider__input--lower js-reviews-score-input js-reviews-score-lower range_input" type="range" min="0" max="${this._maxStep}" step="1" value="0">
                        <input type="hidden" name="as-reviews-score">
                    </div>
                    <div class="as-range-display range_display">${L(__searchFilters_reviewsScore_any)}</div>
                </div>`;
    }

    override setup(params: URLSearchParams): void {

        this._scoreFilter = document.querySelector<HTMLElement>(".js-reviews-score-filter")!;
        this._minScore = this._scoreFilter.querySelector<HTMLInputElement>(".js-reviews-score-lower");
        this._maxScore = this._scoreFilter.querySelector<HTMLInputElement>(".js-reviews-score-upper");
        this._rangeDisplay = this._scoreFilter.nextElementSibling as HTMLElement;

        for (const input of document.querySelectorAll(".js-reviews-score-input")) {

            let minVal = parseInt(this._minScore!.value);
            let maxVal = parseInt(this._maxScore!.value);

            input.addEventListener("input", () => {

                const maxStep = this._maxStep;

                minVal = parseInt(this._minScore!.value);
                maxVal = parseInt(this._maxScore!.value);

                if (input === this._maxScore) {
                    if (minVal >= maxVal) {
                        if (minVal <= 0) {
                            this._maxScore.value = "1";
                            maxVal = 1;
                        } else {
                            this._minScore!.value = String(maxVal - 1);
                            minVal = maxVal - 1;
                        }
                    }
                } else if (maxVal <= minVal) {

                    // Happens when the user clicks to the highest step after the max thumb instead of dragging
                    if (minVal === maxStep) {
                        this._minScore!.value = String(maxStep - 1);
                        minVal = maxStep - 1;

                        this._maxScore!.value = String(maxStep);
                        maxVal = maxStep;
                    } else if (maxVal < maxStep) {
                        this._maxScore!.value = String(minVal + 1);
                        maxVal = minVal + 1;
                    } else {
                        this._minScore!.value = String(maxVal - 1);
                        minVal = maxVal - 1;
                    }
                }

                this._setText(minVal, maxVal);
            });

            input.addEventListener("change", () => {
                const active = minVal !== 0 || maxVal !== this._maxStep;

                this.active = active;
                this.value = active ?
                    `${minVal === 0 ? "" : this._scoreValues[minVal]}-${maxVal === this._maxStep ? "" : this._scoreValues[maxVal]}`
                    : null;

                this._apply();
            });
        }

        super.setup(params);
    }

    override _setState(params: URLSearchParams): void {

        let lowerScoreVal = 0;
        let upperScoreVal = this._maxStep;

        if (params.has("as-reviews-score")) {

            const val = params.get("as-reviews-score")!;
            const match = val.match(/(^\d*)-(\d*)/);

            this._value = val;

            if (match) {
                let lowerIndex = this._scoreValues.indexOf(parseInt(match[1]!));
                let upperIndex = this._scoreValues.indexOf(parseInt(match[2]!));

                if (lowerIndex === -1) {
                    lowerIndex = lowerScoreVal;
                } else {
                    lowerScoreVal = lowerIndex;
                }

                if (upperIndex === -1) {
                    upperIndex = upperScoreVal;
                } else {
                    upperScoreVal = upperIndex;
                }

                this._setText(lowerIndex, upperIndex);
            }
        }

        this._minScore!.value = lowerScoreVal.toString();
        this._maxScore!.value = upperScoreVal.toString();
    }

    override _addRowMetadata(rows = document.querySelectorAll<HTMLElement>(".search_result_row:not([data-as-review-percentage])")): void {

        for (const row of rows) {
            let reviewPercentage = -1;

            const reviewsNode = row.querySelector<HTMLElement>(".search_review_summary");
            if (reviewsNode) {
                const match = reviewsNode.dataset.tooltipHtml?.match(/(?<=%\s?)\d+|\d+(?=\s*%)/);
                if (match) {
                    reviewPercentage = Number(match[0]);
                }
            }

            row.dataset.asReviewPercentage = String(reviewPercentage);
        }
    }

    override _apply(rows = document.querySelectorAll<HTMLElement>(".search_result_row")) {
        if (!this.active) { return; }

        const minScore = this._scoreValues[Number(this._minScore!.value)]!;

        const maxVal = Number(this._maxScore!.value);
        const maxScore = maxVal === this._maxStep
            ? Infinity
            : this._scoreValues[maxVal]!;

        for (const row of rows) {
            const rowScore = Number(row.dataset.asReviewPercentage);
            row.classList.toggle("as-reviews-score", rowScore === -1 || rowScore < minScore || rowScore > maxScore);
        }
    }

    _setText(minVal: number, maxVal: number): void {
        let text;
        if (minVal === 0) {
            if (maxVal === this._maxStep) {
                text = L(__searchFilters_reviewsScore_any);
            } else {
                text = L(__searchFilters_reviewsScore_upTo, {
                    score: this._scoreValues[maxVal]!
                });
            }
        } else if (maxVal === this._maxStep) {
            text = L(__searchFilters_reviewsScore_from, {
                score: this._scoreValues[minVal]!
            });
        } else {
            text = L(__searchFilters_reviewsScore_between, {
                lower: this._scoreValues[minVal]!,
                upper: this._scoreValues[maxVal]!
            });
        }

        this._rangeDisplay!.textContent = text;
    }
}
