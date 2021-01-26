import ContextType from "../../../Modules/Context/ContextType";
import FMediaExpander from "../../Common/FMediaExpander";
import {CCommunityBase} from "../CCommunityBase";

export class CSharedFiles extends CCommunityBase {

    constructor() {
        // Don't apply features if there's an error message (e.g. private items)
        if (document.getElementById("message")) {
            super(ContextType.SHARED_FILES);
            return;
        }

        super(ContextType.SHARED_FILES, [
            FMediaExpander,
        ]);
    }
}
