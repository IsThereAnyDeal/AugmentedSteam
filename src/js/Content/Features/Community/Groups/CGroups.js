import ContextType from "../../../Modules/Context/ContextType";
import {HTML} from "../../../../Core/Html/Html";
import {CCommunityBase} from "../CCommunityBase";
import FGroupsSort from "./FGroupsSort";
import FGroupsManageButton from "./FGroupsManageButton";

export class CGroups extends CCommunityBase {

    constructor() {
        super(ContextType.GROUPS, [
            FGroupsSort,
            FGroupsManageButton,
        ]);

        this.groups = Array.from(document.querySelectorAll(".group_block"));

        if (this.groups.length > 1) {
            this._moveSearchBar();
        }
    }

    _moveSearchBar() {

        // move the search bar to the same position as on friends page
        const container = HTML.wrap("#search_text_box", '<div class="searchBarContainer"></div>');
        document.getElementById("search_results").insertAdjacentElement("beforebegin", container);
    }
}
