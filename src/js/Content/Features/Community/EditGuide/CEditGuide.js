import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FCustomTags from "./FCustomTags";

import FMultiLanguageGuide from "./FMultiLanguageGuide";

export class CEditGuide extends CCommunityBase {

    constructor() {
        super(ContextType.EDIT_GUIDE, [
            FMultiLanguageGuide,
            FCustomTags,
        ]);
    }
}
