import {Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, Sortbox} from "../../../modulesContent";

export default class FGroupsSort extends CallbackFeature {

    setup() {
        this.callback();
    }

    callback() {
        if (!document.getElementById("groups_list")) { return; }

        this._groups = Array.from(document.querySelectorAll(".group_block"));
        if (this._groups.length <= 1) { return; }

        this._initSort = true;

        document.querySelector("span.profile_groups.title").insertAdjacentElement("afterend", Sortbox.get(
            "groups",
            [
                ["default", Localization.str.theworddefault],
                ["members", Localization.str.members],
                ["names", Localization.str.name]
            ],
            SyncedStorage.get("sortgroupsby"),
            (sortBy, reversed) => { this._sortGroups(sortBy, reversed); },
            "sortgroupsby"
        ));
    }

    _sortGroups(sortBy, reversed) {

        if (this._initSort) {
            this._groups.forEach((group, i) => {
                group.dataset.esSortdefault = i;
                group.dataset.esSortnames = group.querySelector(".groupTitle > a").textContent;
                group.dataset.esSortmembers = group.querySelector(".memberRow > a").textContent.match(/\d+/g).join("");
            });

            this._initSort = false;
        }

        this._groups.sort(this._getSortFunc(sortBy));

        if (reversed) {
            this._groups.reverse();
        }

        // TODO better indicator for primary group document.getElementById("primaryGroupBreak");
        const searchResults = document.getElementById("search_results");
        this._groups.forEach(group => searchResults.append(group));
    }

    _getSortFunc(sortBy) {
        const property = `esSort${sortBy}`;
        switch (sortBy) {
            case "default":
                return (a, b) => Number(a.dataset[property]) - Number(b.dataset[property]);
            case "members":
                return (a, b) => Number(b.dataset[property]) - Number(a.dataset[property]);
            case "names":
                return (a, b) => a.dataset[property].localeCompare(b.dataset[property]);
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
