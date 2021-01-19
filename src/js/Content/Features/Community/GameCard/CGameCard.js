import ContextType from "../../../Modules/Context/ContextType";
import {GameId} from "../../../../Core/GameId";
import {CCommunityBase} from "../CCommunityBase";
import FCardExchangeLinks from "../FCardExchangeLinks";
import FCardMarketLinks from "./FCardMarketLinks";
import FCardExtraLinks from "./FCardExtraLinks";

export class CGameCard extends CCommunityBase {

    constructor() {

        super(ContextType.GAME_CARD, [
            FCardExchangeLinks,
            FCardMarketLinks,
            FCardExtraLinks,
        ]);

        this.appid = GameId.getAppidFromGameCard(window.location.pathname);
        this.isFoil = window.location.search.includes("?border=1");

        // Steam sale events that have cards but no store page or trading forum
        this.saleAppids = [267420, 303700, 335590, 368020, 425280, 480730, 566020, 639900, 762800, 876740, 991980, 1195670, 1343890, 1465680];
    }
}
