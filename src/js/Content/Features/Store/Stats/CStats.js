import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FHighlightTopGames from "./FHighlightTopGames";

export class CStats extends CStoreBase {

    constructor() {
        super(ContextType.STATS, [
            FHighlightTopGames,
        ]);
    }
}
