import {Feature} from "modules";

import {Localization, SyncedStorage} from "../../../core_modules";
import {Sortbox} from "common";

export default class FGroupsSort extends Feature {

    apply() {

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

        const sortbox = document.querySelector("div.es-sortbox");
        sortbox.style.flexGrow = "2";
        sortbox.style.marginRight = "20px";
        sortbox.style.marginTop = "0";
        sortbox.style.textAlign = "right";
    }

    _sortGroups(sortBy, reversed) {
        if (this.context.groups.length === 0) { return; }

        if (this._initSort) {

            let i = 0;
            for (const group of this.context.groups) {
                const name = group.querySelector(".groupTitle > a").textContent;
                const membercount = Number(group.querySelector(".memberRow > a").textContent.match(/\d+/g).join(""));
                group.dataset.esSortdefault = i.toString();
                group.dataset.esSortnames = name;
                group.dataset.esSortmembers = membercount.toString();
                i++;
            }

            this._initSort = false;
        }

        this.context.groups.sort(this._getSortFunc(sortBy, `esSort${sortBy}`));

        const searchResults = document.querySelector("#search_results_empty");
        for (const group of this.context.groups) {
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
