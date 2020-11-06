import ContextType from "../../../Modules/Context/ContextType";
import {GameId} from "../../../../Core/GameId";
import {CCommunityBase} from "../CCommunityBase";
import FCardExchangeLinks from "../FCardExchangeLinks";
import FCardMarketLinks from "./FCardMarketLinks";
import FCardFoilLink from "./FCardFoilLink";
import FTradeForumLink from "./FTradeForumLink";

export class CGameCard extends CCommunityBase {

    constructor() {

        super(ContextType.GAME_CARD, [
            FCardExchangeLinks,
            FCardMarketLinks,
            FCardFoilLink,
            FTradeForumLink,
        ]);

        this.appid = GameId.getAppidFromGameCard(window.location.pathname);
        this.isFoil = window.location.search.includes("?border=1");
    }
}
