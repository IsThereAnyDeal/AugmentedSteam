import ContextType from "../../../Modules/Content/Context/ContextType";
import FMediaExpander from "../../common/FMediaExpander";
import {CCommunityBase} from "../CCommunityBase";

export class CSharedFiles extends CCommunityBase {

    constructor() {

        super(ContextType.SHARED_FILES, [
            FMediaExpander,
        ]);
    }
}
