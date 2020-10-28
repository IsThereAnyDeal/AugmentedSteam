import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FCustomTags from "./FCustomTags";

import FMultiLanguageGuide from "./FMultiLanguageGuide";

export class CEditGuide extends CCommunityBase {

    constructor() {
        super([
            FMultiLanguageGuide,
            FCustomTags,
        ]);

        this.type = ContextType.EDIT_GUIDE;
    }
}
