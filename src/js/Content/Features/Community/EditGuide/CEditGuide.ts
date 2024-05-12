import FMultiLanguageGuide from "./FMultiLanguageGuide";
import FCustomTags from "./FCustomTags";
import Context from "@Content/Modules/Context/Context";
import {ContextType} from "@Content/Modules/Context/ContextType";

export default class CEditGuide extends Context {

    constructor() {

        // Don't apply features if there's an error message (e.g. not your guide thus can't edit)
        if (document.getElementById("message")) {
            super(ContextType.EDIT_GUIDE, []);
            return;
        }

        super(ContextType.EDIT_GUIDE, [
            FMultiLanguageGuide,
            FCustomTags,
        ]);
    }
}
