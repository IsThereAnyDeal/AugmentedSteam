import {CStoreBase} from "store/common/CStoreBase";
import {ContextTypes} from "modules";

import {FHighlightTopGames} from "store/stats/FHighlightTopGames";

export class CStatsPage extends CStoreBase {

    constructor() {
        super([
            FHighlightTopGames,
        ]);

        this.type = ContextTypes.STATS;
    }
}
