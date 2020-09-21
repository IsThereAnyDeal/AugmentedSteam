import {Feature} from "modules";

import {FHighlightsTags} from "common/FHighlightsTags";

export class FHighlightTopGames extends Feature {

    apply() {
        return FHighlightsTags.highlightAndTag(document.querySelectorAll(".gameLink"), false);
    }
}
