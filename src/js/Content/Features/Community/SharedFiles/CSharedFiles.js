import ContextType from "../../../Modules/Context/ContextType";
import FMediaExpander from "../../Common/FMediaExpander";
import {CCommunityBase} from "../CCommunityBase";

export class CSharedFiles extends CCommunityBase {

    constructor() {

        super(ContextType.SHARED_FILES, [
            FMediaExpander,
        ]);
    }
}
