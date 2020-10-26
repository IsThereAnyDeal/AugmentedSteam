import {CStoreBase} from "store/common/CStoreBase";
import {ContextTypes} from "modules";

import FHighlightTopGames from "./FHighlightTopGames";

export class CStats extends CStoreBase {

    constructor() {
        super([
            FHighlightTopGames,
        ]);

        this.type = ContextTypes.STATS;
    }
}
