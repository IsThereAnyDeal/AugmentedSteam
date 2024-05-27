import {
    __searchFilters_reviewsCount_count, __searchFilters_reviewsCount_maxCount,
    __searchFilters_reviewsCount_minCount,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import SearchFilter from "./SearchFilter";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";

export default class ReviewsCountSearchFilter extends SearchFilter {

    private _minCount: HTMLInputElement|null = null;
    private _maxCount: HTMLInputElement|null = null;

    constructor(feature: FSearchFilters) {
        super("as-reviews-count", feature);
    }

    override get active(): boolean {
        if (!this._minCount || !this._maxCount) {
            return false;
        }

        return Boolean(this._minCount.value) || Boolean(this._maxCount.value);
    }

    getHTML() {

        return `<div class="as-reviews-count-filter">
                    <div class="as-reviews-count-filter__header">${L(__searchFilters_reviewsCount_count)}</div>
                    <div class="as-reviews-count-filter__content js-reviews-count-filter">
                        <input class="as-reviews-count-filter__input js-reviews-count-input js-reviews-count-lower" type="number" min="0" step="100" placeholder="${L(__searchFilters_reviewsCount_minCount)}">
                        -
                        <input class="as-reviews-count-filter__input js-reviews-count-input js-reviews-count-upper" type="number" min="0" step="100" placeholder="${L(__searchFilters_reviewsCount_maxCount)}">
                        <input type="hidden" name="as-reviews-count">
                    </div>
                </div>`;
    }

    override setup(params: URLSearchParams): void {

        this._minCount = document.querySelector<HTMLInputElement>(".js-reviews-count-lower");
        this._maxCount = document.querySelector<HTMLInputElement>(".js-reviews-count-upper");

        for (const input of document.querySelectorAll(".js-reviews-count-input")) {

            input.addEventListener("change", () => {
                this._apply();

                const minVal = this._minCount?.value ?? "";
                const maxVal = this._maxCount?.value ?? "";
                let val = null;

                if ((minVal && Number(minVal) !== 0) || maxVal) {
                    val = `${minVal}-${maxVal}`;
                }

                this.value = val;
            });

            // @ts-ignore
            input.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter") {

                    // Prevents unnecessary submitting of the advanced search form
                    e.preventDefault();

                    input.dispatchEvent(new Event("change"));
                }
            });
        }

        super.setup(params);
    }

    override _setState(params: URLSearchParams): void {

        let lowerCountVal = "";
        let upperCountVal = "";

        if (params.has("as-reviews-count")) {

            const val = params.get("as-reviews-count")!;
            const match = val.match(/(^\d*)-(\d*)/);

            this._value = val;

            if (match) {
                let lower = parseInt(match[1]!);
                let upper = parseInt(match[2]!);

                if (!isNaN(lower)) {
                    lowerCountVal = String(lower);
                }
                if (!isNaN(upper)) {
                    upperCountVal = String(upper);
                }
            }
        }

        if (lowerCountVal !== this._minCount!.value) {
            this._minCount!.value = lowerCountVal;
        }
        if (upperCountVal !== this._maxCount!.value) {
            this._maxCount!.value = upperCountVal;
        }
    }

    override _addRowMetadata(rows = document.querySelectorAll<HTMLElement>(".search_result_row:not([data-as-review-count])")): void {

        for (const row of rows) {
            let reviewCount = 0;

            const reviewsNode = row.querySelector<HTMLElement>(".search_review_summary");
            if (reviewsNode) {
                const match = reviewsNode.dataset.tooltipHtml?.match(/(?<!%\s*[\d,]*)\d[\d,]+(?![\d,]*\s*%)/);
                if (match) {
                    reviewCount = Number(match[0].replace(/,/g, ""));
                }
            }

            row.dataset.asReviewCount = String(reviewCount);
        }
    }

    override _apply(rows = document.querySelectorAll<HTMLElement>(".search_result_row")) {

        const minCount = Number(this._minCount!.value);
        const maxCount = this._maxCount!.value === "" ? Infinity : Number(this._maxCount!.value);

        for (const row of rows) {
            const rowCount = Number(row.dataset.asReviewCount);
            row.classList.toggle("as-reviews-count", rowCount < minCount || rowCount > maxCount);
        }
    }
}
