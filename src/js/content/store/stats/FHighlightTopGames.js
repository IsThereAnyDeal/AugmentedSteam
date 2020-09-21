import {ASFeature} from "modules";

import {FHighlightsTags} from "common/FHighlightsTags";

export class FHighlightTopGames extends ASFeature {

    apply() {
        return FHighlightsTags.highlightAndTag(document.querySelectorAll(".gameLink"), false);
    }
}
