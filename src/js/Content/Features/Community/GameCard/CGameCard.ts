import AppId from "@Core/GameId/AppId";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FCardExchangeLinks from "@Content/Features/Community/GameCard/FCardExchangeLinks";
import FCardMarketLinks from "@Content/Features/Community/GameCard/FCardMarketLinks";
import FCardExtraLinks from "@Content/Features/Community/GameCard/FCardExtraLinks";

export default class CGameCard extends Context {

    public readonly appid: number;
    public readonly isFoil: boolean;
    public readonly saleAppids: number[];

    constructor(params: ContextParams) {
        super(params);

        this.appid = AppId.fromGameCardUrl(window.location.pathname)!;
        this.isFoil = new URLSearchParams(window.location.search).get("border") === "1";

        /*
         * Steam sale events that have cards but no store page or trading forum
         * https://github.com/JustArchiNET/ArchiSteamFarm/blob/ae8224b734199a203b7e09e9d7ce62115806ea01/ArchiSteamFarm/Steam/Cards/CardsFarmer.cs#L61
         */
        this.saleAppids = [
            267420, 303700, 335590, 368020, 425280,
            480730, 566020, 639900, 762800, 876740,
            991980, 1195670, 1343890, 1465680, 1658760,
            1797760, 2021850, 2243720, 2459330, 2640280,
            2861690
        ];
    }
}


/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/gamecards/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CGameCard(params);

    await features(context, [
        ...commonFeatures(),
        FCardExchangeLinks,
        FCardMarketLinks,
        FCardExtraLinks,
    ]);
}
