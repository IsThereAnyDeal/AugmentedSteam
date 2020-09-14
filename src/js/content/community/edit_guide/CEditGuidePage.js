import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";
import {FCustomTags} from "./FCustomTags";

import {FMultiLanguageGuide} from "./FMultiLanguageGuide";

export class CEditGuidePage extends CCommunityBase {

    constructor() {
        super([
            FMultiLanguageGuide,
            FCustomTags,
        ]);

        this.type = ContextTypes.EDIT_GUIDE;
    }
}
