import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FGroupsSort from "./FGroupsSort";
import FGroupsManageButton from "./FGroupsManageButton";

import {HTML} from "../../../Modules/Core/Html/Html";

export class CGroups extends CCommunityBase {

    constructor() {
        super([
            FGroupsSort,
            FGroupsManageButton,
        ]);

        this.type = ContextType.GROUPS;

        this.groups = Array.from(document.querySelectorAll(".group_block"));

        this._moveSearchBar();
    }

    _moveSearchBar() {

        // move the search bar to the same position as on friends page
        const container = HTML.wrap("#search_text_box", '<div class="searchBarContainer"></div>');
        document.getElementById("search_results").insertAdjacentElement("beforebegin", container);
    }
}
