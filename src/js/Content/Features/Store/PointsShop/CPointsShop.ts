import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import Context from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CPointsShop extends Context {

    constructor() {

        super(ContextType.POINTS_SHOP, [
            FBackgroundPreviewLink,
        ]);
    }
}
