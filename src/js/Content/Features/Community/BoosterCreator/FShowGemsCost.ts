import type CBoosterCreator from "@Content/Features/Community/BoosterCreator/CBoosterCreator";
import Feature from "@Content/Modules/Context/Feature";
import SteamFacade from "@Content/Facades/SteamFacade";
import {MountTargetError} from "@Core/Errors/Errors";

type BoosterData = Record<string, {
    appid: number,
    name: string,
    series: number,
    price: string
}>;

/**
 * Appends gem counts to the games selector options
 */
export default class FShowGemsCost extends Feature<CBoosterCreator> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {

        const boosterData = (await SteamFacade.global<{sm_rgBoosterData: BoosterData}>("CBoosterCreatorPage"))?.sm_rgBoosterData;
        if (!boosterData) {
            throw new Error("Booster data not found");
        }

        // Localized string of "(quantifier) + Gems"
        const gemWord = document.querySelector(".booster_creator_goostatus .goovalue")?.nextSibling?.textContent;
        if (!gemWord) {
            throw new MountTargetError();
        }

        const options = document.querySelector<HTMLSelectElement>("#booster_game_selector")?.options ?? [];
        for (const option of options) {
            const data = boosterData[option.value];
            if (data) {
                option.append(` - ${data.price} ${gemWord}`);
            }
        }
        return null;
    }
}
