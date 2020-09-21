import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FCardExchangeLinks} from "community/common/FCardExchangeLinks";
import {FCardMarketLinks} from "community/gamecard/FCardMarketLinks";
import {FCardFoilLink} from "community/gamecard/FCardFoilLink";
import {FTradeForumLink} from "community/gamecard/FTradeForumLink";

import {GameId} from "core";

export class CGameCardPage extends CCommunityBase {

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
