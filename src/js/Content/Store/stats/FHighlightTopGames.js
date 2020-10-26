import {Feature} from "modules";

import FHighlightsTags from "common/FHighlightsTags";

export default class FHighlightTopGames extends Feature {

    apply() {
        return FHighlightsTags.highlightAndTag(document.querySelectorAll(".gameLink"), false);
    }
}
