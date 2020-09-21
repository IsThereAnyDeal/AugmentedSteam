import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FMediaExpander} from "common/FMediaExpander";

export class CSharedFiles extends CCommunityBase {

    constructor() {
        
        super([
            FMediaExpander,
        ]);

        this.type = ContextTypes.SHARED_FILES;
    }
}
