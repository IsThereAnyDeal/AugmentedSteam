import {CStoreBase} from "store/common/CStoreBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FHighlightTopGames from "./FHighlightTopGames";

export class CStats extends CStoreBase {

    constructor() {
        super([
            FHighlightTopGames,
        ]);

        this.type = ContextType.STATS;
    }
}
