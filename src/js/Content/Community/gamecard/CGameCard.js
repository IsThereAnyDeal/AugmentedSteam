import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import FCardExchangeLinks from "community/common/FCardExchangeLinks";
import FCardMarketLinks from "./FCardMarketLinks";
import FCardFoilLink from "./FCardFoilLink";
import FTradeForumLink from "./FTradeForumLink";

import {GameId} from "../../../Modules/Core/GameId";

export class CGameCard extends CCommunityBase {

    constructor() {

        super([
            FCardExchangeLinks,
            FCardMarketLinks,
            FCardFoilLink,
            FTradeForumLink,
        ]);

        this.type = ContextTypes.GAME_CARD;

        this.appid = GameId.getAppidFromGameCard(window.location.pathname);
        this.isFoil = window.location.search.includes("?border=1");
    }
}
