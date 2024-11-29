import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FReviewSort from "./FReviewSort";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CRecommended extends CCommunityBase {

    constructor(params: ContextParams) {

        super(params, ContextType.RECOMMENDED, [
            FReviewSort,
        ]);
    }
}
