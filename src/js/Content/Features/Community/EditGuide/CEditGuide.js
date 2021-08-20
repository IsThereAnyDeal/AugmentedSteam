import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FCustomTags from "./FCustomTags";

import FMultiLanguageGuide from "./FMultiLanguageGuide";

export class CEditGuide extends CCommunityBase {

    constructor() {
        // Don't apply features if there's an error message (e.g. private items)
        if (document.getElementById("message")) {
            super(ContextType.EDIT_GUIDE);
            return;
        }

        super(ContextType.EDIT_GUIDE, [
            FMultiLanguageGuide,
            FCustomTags,
        ]);
    }
}
