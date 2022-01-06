import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FEarlyAccess from "../../Common/FEarlyAccess";
import FReviewSort from "./FReviewSort";

export class CRecommended extends CCommunityBase {

    constructor() {

        super(ContextType.RECOMMENDED, [
            FReviewSort,
        ]);

        FEarlyAccess.show(document.querySelectorAll(".leftcol > a, .gameLogoHolder_default"));
    }
}
