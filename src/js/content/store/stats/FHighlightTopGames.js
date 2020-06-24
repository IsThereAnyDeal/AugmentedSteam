import {ASFeature} from "../../ASFeature.js";

import {FHighlightsTags} from "../../common/FHighlightsTags.js";

export class FHighlightTopGames extends ASFeature {

    apply() {
        return FHighlightsTags.highlightAndTag(document.querySelectorAll(".gameLink"), false);
    }
}
