import {Localization, SyncedStorage} from "../../../../../modulesCore";
import FEarlyAccess from "../../../Common/FEarlyAccess";
import {SimpleSearchFilter} from "./SimpleSearchFilter";

export class EarlyAccessSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_ea, "ea");
    }

    _setState(params) {
        super._setState(params);

        if (this.active) {
            this._addRowMetadata(document.querySelectorAll(".search_result_row:not(.es_ea_checked)"));
        }
    }

    _onClick() {
        super._onClick();

        if (this.active) {
            this._addRowMetadata(document.querySelectorAll(".search_result_row:not(.es_ea_checked)"));
        }
    }

    async _addRowMetadata(rows) {
        if (!this.active || SyncedStorage.get("show_early_access")) { return; }

        for (const row of await FEarlyAccess.getEaNodes(rows)) {
            row.classList.add("es_early_access");
        }
    }
}
