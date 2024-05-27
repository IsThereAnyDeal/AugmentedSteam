import {L} from "@Core/Localization/Localization";
import {__searchFilters_hideEa} from "@Strings/_strings";
import SimpleSearchFilter from "./SimpleSearchFilter";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";
import Settings from "@Options/Data/Settings";
import EarlyAccessUtils from "@Content/Modules/EarlyAccess/EarlyAccessUtils";

export default class EarlyAccessSearchFilter extends SimpleSearchFilter {

    constructor(feature: FSearchFilters) {
        super("as-hide", feature, L(__searchFilters_hideEa), "ea");
    }

    override _setState(params: URLSearchParams): void {
        super._setState(params);

        if (this.active) {
            this._addRowMetadata(document.querySelectorAll(".search_result_row:not(.es_ea_checked)"));
        }
    }

    override _onClick(): void {
        super._onClick();

        if (this.active) {
            this._addRowMetadata(document.querySelectorAll(".search_result_row:not(.es_ea_checked)"));
        }
    }

    override async _addRowMetadata(rows: NodeListOf<HTMLElement>): Promise<void> {
        if (!this.active || Settings.show_early_access) { return; }

        for (const row of await EarlyAccessUtils.getEaNodes(rows)) {
            row.classList.add("es_early_access");
        }
    }
}
