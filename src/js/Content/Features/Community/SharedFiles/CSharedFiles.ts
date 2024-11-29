import ContextType from "@Content/Modules/Context/ContextType";
import CApp from "../App/CApp";
import FMediaExpander from "../../Common/FMediaExpander";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CSharedFiles extends CApp {

    constructor(params: ContextParams) {

        // Don't apply features if there's an error message (e.g. private or non-existent items)
        if (document.getElementById("message") !== null) {
            super(params, ContextType.SHARED_FILES);
            return;
        }

        super(params, ContextType.SHARED_FILES, [
            FMediaExpander,
        ]);
    }
}
