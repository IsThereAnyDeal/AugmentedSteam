import {
    __searchFilters_discountPercent_count, __searchFilters_discountPercent_maxCount,
    __searchFilters_discountPercent_minCount,
} from "@Strings/_strings";
import SearchFilter from "@Content/Features/Store/Search/Filters/SearchFilter";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";
import { L } from "@Core/Localization/Localization";

export default class DiscountPercentSearchFilter extends SearchFilter {

    private _minCount: HTMLInputElement|null = null;
    private _maxCount: HTMLInputElement|null = null;

    constructor(feature: FSearchFilters) {
        super("as-discount-percent", feature);
    }

    override get active(): boolean {
        if (!this._minCount || !this._maxCount) {
            return false;
        }

        return Boolean(this._minCount.value) || Boolean(this._maxCount.value);
    }

    getHTML(): string {

        return `<div class="as-discount-percent-filter">
                    <div class="as-discount-percent-filter__header">${L(__searchFilters_discountPercent_count)}</div>
                    <div class="as-discount-percent-filter__content js-discount-percent-filter">
                        <input class="as-discount-percent-filter__input js-discount-percent-input js-discount-percent-lower" type="number" min="0" max="100" step="1" placeholder="${L(__searchFilters_discountPercent_minCount)}">
                        -
                        <input class="as-discount-percent-filter__input js-discount-percent-input js-discount-percent-upper" type="number" min="0" max="100" step="1" placeholder="${L(__searchFilters_discountPercent_maxCount)}">
                        <input type="hidden" name="as-discount-percent">
                    </div>
                </div>`;
    }

    override setup(params: URLSearchParams): void {

        this._minCount = document.querySelector<HTMLInputElement>(".js-discount-percent-lower");
        this._maxCount = document.querySelector<HTMLInputElement>(".js-discount-percent-upper");

        for (const input of document.querySelectorAll(".js-discount-percent-input")) {

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

        let lowerCountVal: string = "";
        let upperCountVal: string = "";

        if (params.has("as-discount-percent")) {

            const val = params.get("as-discount-percent")!;
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

    override _addRowMetadata(rows = document.querySelectorAll<HTMLElement>(".search_result_row:not([data-as-discount-percent])")): void {

        for (const row of rows) {

            // Exclude bundles that don't have additional discounts
            const discountEl = row.querySelector<HTMLElement>(".discount_block:not(.no_discount)");
            row.dataset.asDiscountPercent = discountEl?.dataset.discount ?? "0";
        }
    }

    override _apply(rows = document.querySelectorAll<HTMLElement>(".search_result_row")): void {

        const minDiscount = (this._minCount?.value ?? "") === "" ? 0 : Number(this._minCount!.value);
        const maxDiscount = (this._maxCount?.value ?? "") === "" ? Infinity : Number(this._maxCount!.value);

        for (const row of rows) {
            const rowDiscount = Number(row.dataset.asDiscountPercent);
            row.classList.toggle("as-discount-percent", rowDiscount < minDiscount || rowDiscount > maxDiscount);
        }
    }
}
