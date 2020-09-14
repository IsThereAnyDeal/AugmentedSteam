import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";
import {FReviewSort} from "./FReviewSort";

export class CRecommendedPage extends CCommunityBase {

    constructor() {
        
        super([
            FReviewSort,
        ]);

        this.type = ContextTypes.RECOMMENDED;
    }
}
