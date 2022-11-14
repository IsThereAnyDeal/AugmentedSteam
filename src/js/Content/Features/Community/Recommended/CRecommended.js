import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FReviewSort from "./FReviewSort";

export class CRecommended extends CCommunityBase {

    constructor() {

        super(ContextType.RECOMMENDED, [
            FReviewSort,
        ]);
    }
}
