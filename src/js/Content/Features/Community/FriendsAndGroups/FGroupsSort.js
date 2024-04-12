import {__members, __name, __theworddefault} from "../../../../../localization/compiled/_strings";
import {SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, Sortbox} from "../../../modulesContent";

export default class FGroupsSort extends CallbackFeature {

    setup() {
        this.callback();
    }

    callback() {
        if (!document.getElementById("groups_list")) { return; }

        this._container = document.getElementById("search_results");
        if (this._container.querySelectorAll(".group_block").length <= 1) { return; }

        document.querySelector("span.profile_groups.title").insertAdjacentElement("afterend", Sortbox.get(
            "groups",
            [
                ["default", L(__theworddefault)],
                ["members", L(__members)],
                ["names", L(__name)]
            ],
            SyncedStorage.get("sortgroupsby"),
            (sortBy, reversed) => { this._sortGroups(sortBy, reversed); },
            "sortgroupsby"
        ));
    }

    _sortGroups(sortBy, reversed) {

        const property = `esSort${sortBy}`;
        const rows = [];

        // Query available groups on each sort because they may be removed by our leave group feature, see #1520
        this._container.querySelectorAll(".group_block").forEach((node, i) => {

            // Set default position
            if (!node.dataset.esSortdefault) {
                node.dataset.esSortdefault = i;
            }

            let value = node.dataset[property];
            if (typeof value === "undefined") {
                if (sortBy === "members") {
                    value = node.querySelector(".memberRow > a").textContent.match(/\d+/g).join("");
                } else if (sortBy === "names") {
                    value = node.querySelector(".groupTitle > a").textContent;
                }

                if (!value) { return; }
                value = String(value);
                node.dataset[property] = value;
            }

            rows.push([value, node]);
        });

        rows.sort(this._getSortFunc(sortBy));

        if (reversed) {
            rows.reverse();
        }

        rows.forEach(row => this._container.append(row[1]));
    }

    _getSortFunc(sortBy) {
        switch (sortBy) {
            case "default":
                return (a, b) => Number(a[0]) - Number(b[0]);
            case "members":
                return (a, b) => Number(b[0]) - Number(a[0]);
            case "names":
                return (a, b) => a[0].localeCompare(b[0]);
            default:
                this.logError(
                    new Error("Invalid sorting criteria"),
                    "Can't sort groups by criteria '%s'",
                    sortBy,
                );
                return () => 0;
        }
    }
}
