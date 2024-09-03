import type CBoosterCreator from "@Content/Features/Community/BoosterCreator/CBoosterCreator";
import Feature from "@Content/Modules/Context/Feature";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

type BoosterData = Record<string, {
    appid: number,
    name: string,
    series: number,
    price: string
}>;

export default class FShowGemsCost extends Feature<CBoosterCreator> {

    override async apply() {

        const boosterData = (await SteamFacade.global<{sm_rgBoosterData: BoosterData}>("CBoosterCreatorPage"))?.sm_rgBoosterData;
        if (!boosterData) {
            throw new Error("Booster data not found");
        }

        // Localized string of "(quantifier) + Gems"
        const gemWord = document.querySelector(".booster_creator_goostatus .goovalue")?.nextSibling?.textContent;
        if (!gemWord) {
            return;
        }

        const options = document.querySelector<HTMLSelectElement>("#booster_game_selector")?.options ?? [];
        for (const option of options) {
            const data = boosterData[option.value];
            if (data) {
                option.append(` - ${data.price} ${gemWord}`);
            }
        }
    }
}
