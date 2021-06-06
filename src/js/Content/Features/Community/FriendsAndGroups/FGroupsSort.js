import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
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

        // move the search bar to the same position as on friends page
        const container = HTML.wrap("#search_text_box", '<div class="searchBarContainer"></div>');
        document.getElementById("search_results").insertAdjacentElement("beforebegin", container);

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

            let i = 0;
            for (const group of this._groups) {
                const name = group.querySelector(".groupTitle > a").textContent;
                const membercount = Number(group.querySelector(".memberRow > a").textContent.match(/\d+/g).join(""));
                group.dataset.esSortdefault = i.toString();
                group.dataset.esSortnames = name;
                group.dataset.esSortmembers = membercount.toString();
                i++;
            }

            this._initSort = false;
        }

        this._groups.sort(this._getSortFunc(sortBy, `esSort${sortBy}`));

        const searchResults = document.querySelector("#search_results_empty");
        for (const group of this._groups) {
            if (reversed) {
                searchResults.insertAdjacentElement("afterend", group);
            } else {
                searchResults.parentElement.appendChild(group);
            }
        }
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
