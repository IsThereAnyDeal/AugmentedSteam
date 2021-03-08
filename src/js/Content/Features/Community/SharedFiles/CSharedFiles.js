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

        this.appid = Number(document.querySelector(".apphub_OtherSiteInfo [data-appid]").dataset.appid);
    }
}
