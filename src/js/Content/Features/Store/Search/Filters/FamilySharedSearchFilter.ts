import {L} from "@Core/Localization/Localization";
import {__searchFilters_hideFamilyshared} from "@Strings/_strings";
import SimpleSearchFilter from "./SimpleSearchFilter";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";

export default class FamilySharedSearchFilter extends SimpleSearchFilter {

    constructor(feature: FSearchFilters) {
        super("as-hide", feature, L(__searchFilters_hideFamilyshared), "familyshared");
    }

    override _setState(params: URLSearchParams): void {
        super._setState(params);

        if (this.active) {
            this._addRowMetadata(document.querySelectorAll(".search_result_row:not(.es_familyshared_checked)"));
        }
    }

    override _onClick(): void {
        super._onClick();

        if (this.active) {
            this._addRowMetadata(document.querySelectorAll(".search_result_row:not(.es_familyshared_checked)"));
        }
    }

    override async _addRowMetadata(rows: NodeListOf<HTMLElement>): Promise<void> {
        if (!this.active) { return; }

        const {shareable} = await this._feature.getFamilyLibrary();

        for (const row of rows) {
            row.classList.add("es_familyshared_checked");

            const appid = Number(row.dataset.dsAppid);
            if (Number.isFinite(appid) && shareable.has(appid)) {
                row.classList.add("as-hide-familyshared");
            }
        }
    }
}
