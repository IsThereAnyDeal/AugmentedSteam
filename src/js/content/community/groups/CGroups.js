import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FGroupsSort} from "community/groups/FGroupsSort";
import {FGroupsManageButton} from "community/groups/FGroupsManageButton";

import {HTML} from "core";

export class CGroups extends CCommunityBase {

    constructor() {
        super([
            FGroupsSort,
            FGroupsManageButton,
        ]);

        this.type = ContextTypes.GROUPS;

        this.groups = Array.from(document.querySelectorAll(".group_block"));

        this._moveSearchBar();
    }

    _moveSearchBar() {
        // move the search bar to the same position as on friends page
        let container = HTML.wrap("#search_text_box", '<div class="searchBarContainer"></div>');
        document.getElementById("search_results").insertAdjacentElement("beforebegin", container);
    }
}
