import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";
import {FCustomTags} from "./FCustomTags";

import {FMultiLanguageGuide} from "./FMultiLanguageGuide";

export class CEditGuide extends CCommunityBase {

    constructor() {
        super([
            FMultiLanguageGuide,
            FCustomTags,
        ]);

        this.type = ContextTypes.EDIT_GUIDE;
    }
}
