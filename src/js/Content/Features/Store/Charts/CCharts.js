import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FHighlightTopGames from "./FHighlightTopGames";

export class CCharts extends CStoreBase {
    constructor() {
        super(ContextType.CHARTS, [
            FHighlightTopGames,
        ]);
    }
}

