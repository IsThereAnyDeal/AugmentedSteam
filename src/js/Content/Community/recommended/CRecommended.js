import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FReviewSort from "./FReviewSort";

export class CRecommended extends CCommunityBase {

    constructor() {

        super([
            FReviewSort,
        ]);

        this.type = ContextType.RECOMMENDED;
    }
}
