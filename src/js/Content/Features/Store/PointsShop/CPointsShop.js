import {Context, ContextType} from "../../../modulesContent";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";

export class CPointsShop extends Context {

    constructor() {

        super(ContextType.POINTS_SHOP, [
            FBackgroundPreviewLink,
        ]);
    }
}
