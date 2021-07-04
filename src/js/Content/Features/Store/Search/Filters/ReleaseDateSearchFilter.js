import {Localization} from "../../../../../Core/Localization/Localization";
import {SearchFilter} from "./SearchFilter";

export class ReleaseDateSearchFilter extends SearchFilter {

    constructor(feature) {
        super("as-release-date", feature);

        this._val = null;
    }

    get active() {
        return this._minDate.value || this._maxDate.value;
    }

    getHTML() {

        return `<div class="as-filter">
                    <div class="as-filter__header">${Localization.str.search_filters.release_date}</div>
                    <div class="as-filter__content js-release-date-filter">
                        <input class="as-filter__input js-release-date-input js-release-date-lower" type="date">
                        -
                        <input class="as-filter__input js-release-date-input js-release-date-upper" type="date"">
                        <input type="hidden" name="as-release-date">
                    </div>
                </div>`;
    }

    setup(params) {

        this._minDate = document.querySelector(".js-release-date-lower");
        this._maxDate = document.querySelector(".js-release-date-upper");

        for (const input of document.querySelectorAll(".js-release-date-input")) {

            input.addEventListener("change", () => {
                this._apply();

                const minVal = this._minDate.value;
                const maxVal = this._maxDate.value;
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

        let lowerDateVal = "";
        let upperDateVal = "";

        if (params.has("as-release-date")) {

            const val = params.get("as-release-date");
            const match = val.match(/(^\d+-\d+-\d+){0,1}-(\d+-\d+-\d+){0,1}/);

            this._value = val;

            if (match) {
                const [, lower, upper] = match;
                lowerDateVal = lower;
                upperDateVal = upper;
            }
        }

        if (lowerDateVal !== this._minDate.value) {
            this._minDate.value = lowerDateVal;
        }
        if (upperDateVal !== this._maxDate.value) {
            this._maxDate.value = upperDateVal;
        }
    }

    _addRowMetadata(rows = document.querySelectorAll(".search_result_row:not([data-as-release-date])")) {

        for (const row of rows) {
            let releaseDate = 0;
            const releasedNode = row.querySelector(".search_released");
            if (releasedNode) {
                const date = new Date(releasedNode.innerText.replace(/.|,/g, " ").replace(/(nd|rd|th|st) /g, " "));
                
                if (!isNaN(date)) {
                    releaseDate = date.valueOf();
                }
            }

            row.dataset.asReleaseDate = releaseDate;
        }
    }

    _apply(rows = document.querySelectorAll(".search_result_row")) {

        const minDate = new Date(this._minDate.value).valueOf();
        const maxDate = this._maxDate.value === "" ? Infinity : new Date(this._maxDate.value).valueOf();

        for (const row of rows) {
            const rowDate = Number(row.dataset.asReleaseDate);
            row.classList.toggle("as-release-date", rowDate < minDate || rowDate > maxDate);
        }
    }
}
