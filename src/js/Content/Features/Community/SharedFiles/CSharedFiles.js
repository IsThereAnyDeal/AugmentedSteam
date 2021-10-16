import {GameId} from "../../../../modulesCore";
import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FMediaExpander from "../../Common/FMediaExpander";
import FSkipAgecheck from "../../Common/FSkipAgecheck";
import FSubscribeAllDependencies from "./FSubscribeAllDependencies";

export class CSharedFiles extends CCommunityBase {

    constructor() {
        // Don't apply features if there's an error message (e.g. private items)
        if (document.getElementById("message")) {
            super(ContextType.SHARED_FILES);
            return;
        }

        super(ContextType.SHARED_FILES, [
            FMediaExpander,
            FSkipAgecheck,
            FSubscribeAllDependencies,
        ]);

        /*
         * Get appid from the "All" tab link.
         * The value will be `null` for e.g. Greenlight items that don't have the tabs section.
         */
        this.appid = GameId.getAppid(document.querySelector("a.apphub_sectionTab"));
    }
}
