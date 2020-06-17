import { CStoreBase } from "../common/CStoreBase.js";
import { ContextTypes } from "../../ASContext.js";

import { FHighlightTopGames } from "./FHighlightTopGames.js";

export class CStatsPage extends CStoreBase {

    constructor() {
        super([
            FHighlightTopGames,
        ]);

        this.type = ContextTypes.STATS;

        this.applyFeatures();
    }
}
