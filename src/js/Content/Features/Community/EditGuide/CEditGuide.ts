import FMultiLanguageGuide from "./FMultiLanguageGuide";
import FCustomTags from "./FCustomTags";
import Context from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CEditGuide extends Context {

    constructor() {

        // Don't apply features if there's an error message (e.g. not your guide thus can't edit)
        const hasFeatures = !document.getElementById("message");

        super(ContextType.EDIT_GUIDE, hasFeatures ? [
            FMultiLanguageGuide,
            FCustomTags,
        ] : []);
    }
}
