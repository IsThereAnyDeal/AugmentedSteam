import AppId from "@Core/GameId/AppId";
import {ContextType} from "../../../Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FCardExchangeLinks from "../FCardExchangeLinks";
import FCardExtraLinks from "./FCardExtraLinks";
import FCardMarketLinks from "./FCardMarketLinks";

export default class CGameCard extends CCommunityBase {

    public readonly appid: number;
    public readonly isFoil: boolean;
    public readonly saleAppids: number[];

    constructor() {

        super(ContextType.GAME_CARD, [
            FCardExchangeLinks,
            FCardMarketLinks,
            FCardExtraLinks,
        ]);

        this.appid = AppId.fromGameCardUrl(window.location.pathname)!;
        this.isFoil = new URLSearchParams(window.location.search).get("border") === "1";

        /*
         * Steam sale events that have cards but no store page or trading forum
         * https://github.com/JustArchiNET/ArchiSteamFarm/blob/eeccc36fe4ecd863d1e655a68b420445940a2f33/ArchiSteamFarm/Steam/Cards/CardsFarmer.cs#L54
         */
        this.saleAppids = [267420, 303700, 335590, 368020, 425280, 480730, 566020, 639900, 762800, 876740, 991980, 1195670, 1343890, 1465680, 1658760, 1797760];
    }
}
