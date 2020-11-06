import {Feature} from "../../../Modules/Feature/Feature";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightTopGames extends Feature {

    apply() {
        return FHighlightsTags.highlightAndTag(document.querySelectorAll(".gameLink"), false);
    }
}
