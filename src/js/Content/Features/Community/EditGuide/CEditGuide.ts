import FCustomTags from "./FCustomTags";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CEditGuide extends Context {

    constructor(params: ContextParams) {

        // Don't apply features if there's an error message (e.g. not your guide thus can't edit)
        const hasFeatures = document.getElementById("message") === null;

        super(params, ContextType.EDIT_GUIDE, hasFeatures ? [
            FCustomTags,
        ] : []);
    }
}
