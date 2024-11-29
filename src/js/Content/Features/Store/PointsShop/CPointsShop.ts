import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CPointsShop extends Context {

    constructor(params: ContextParams) {

        super(params, ContextType.POINTS_SHOP, [
            FBackgroundPreviewLink,
        ]);
    }
}
