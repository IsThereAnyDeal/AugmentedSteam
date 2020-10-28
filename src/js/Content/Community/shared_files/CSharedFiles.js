import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FMediaExpander from "common/FMediaExpander";

export class CSharedFiles extends CCommunityBase {

    constructor() {

        super([
            FMediaExpander,
        ]);

        this.type = ContextType.SHARED_FILES;
    }
}
