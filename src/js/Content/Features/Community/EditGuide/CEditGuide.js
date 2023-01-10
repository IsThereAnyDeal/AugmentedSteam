import {Context, ContextType} from "../../../modulesContent";
import FMultiLanguageGuide from "./FMultiLanguageGuide";
import FCustomTags from "./FCustomTags";

export class CEditGuide extends Context {

    constructor() {

        // Don't apply features if there's an error message (e.g. not your guide thus can't edit)
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
