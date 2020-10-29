import ContextType from "../../../Modules/Content/Context/ContextType";
import {CStoreBase} from "../common/CStoreBase";
import FHighlightTopGames from "./FHighlightTopGames";

export class CStats extends CStoreBase {

    constructor() {
        super(ContextType.STATS, [
            FHighlightTopGames,
        ]);
    }
}
