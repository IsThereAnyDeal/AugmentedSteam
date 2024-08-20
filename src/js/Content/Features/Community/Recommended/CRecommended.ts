import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FReviewSort from "./FReviewSort";

export default class CRecommended extends CCommunityBase {

    constructor() {

        super(ContextType.RECOMMENDED, [
            FReviewSort,
        ]);
    }
}
