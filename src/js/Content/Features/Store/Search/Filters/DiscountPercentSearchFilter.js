import {Localization} from "../../../../../Core/Localization/Localization";
import {SearchFilter} from "./SearchFilter";

export class DiscountPercentSearchFilter extends SearchFilter {

    constructor(feature) {
        super("as-discount-percent", feature);

        this._val = null;
    }

    get active() {
        return this._minCount.value || this._maxCount.value;
    }

    getHTML() {

        return `<div class="as-discount-percent-filter">
                    <div class="as-discount-percent-filter__header">${Localization.str.search_filters.discount_percent.count}</div>
                    <div class="as-discount-percent-filter__content js-discount-percent-filter">
                        <input class="as-discount-percent-filter__input js-discount-percent-input js-discount-percent-lower" type="number" min="0" max="100" step="1" placeholder="${Localization.str.search_filters.discount_percent.min_count}">
                        -
                        <input class="as-discount-percent-filter__input js-discount-percent-input js-discount-percent-upper" type="number" min="0" max="100" step="1" placeholder="${Localization.str.search_filters.discount_percent.max_count}">
                        <input type="hidden" name="as-discount-percent">
                    </div>
                </div>`;
    }

    setup(params) {

        this._minCount = document.querySelector(".js-discount-percent-lower");
        this._maxCount = document.querySelector(".js-discount-percent-upper");

        for (const input of document.querySelectorAll(".js-discount-percent-input")) {

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

        if (params.has("as-discount-percent")) {

            const val = params.get("as-discount-percent");
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

    _addRowMetadata(rows = document.querySelectorAll(".search_result_row:not([data-as-discount-percent])")) {

        for (const row of rows) {
            const discountPercent = this._getDiscountPercent(row);
            row.dataset.asDiscountPercent = discountPercent;
        }
    }

    _getDiscountPercent(row) {
        let discount = 0;
        const discountEl = row.querySelector(".discount_block");
        
        if (!discountEl) {
            return 0;
        }

        const discountAmount = Number(discountEl.dataset["discount"])
        return isNaN(discountAmount) ? 0 : discountAmount
    }

    _apply(rows = document.querySelectorAll(".search_result_row")) {

        const minDiscount = this._minCount.value === "" ? 0 : Number(this._minCount.value);
        const maxDiscount = this._maxCount.value === "" ? Infinity : Number(this._maxCount.value);

        for (const row of rows) {
            const rowDiscount = Number(row.dataset.asDiscountPercent);
            row.classList.toggle("as-discount-percent", rowDiscount < minDiscount || rowDiscount > maxDiscount);
        }
    }
}
