import CBoosterCreator from "@Content/Features/Community/BoosterCreator/CBoosterCreator";
import Feature from "@Content/Modules/Context/Feature";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FShowGemsCost extends Feature<CBoosterCreator> {

    override async apply() {

        // TODO add boosterData type
        const boosterData = await (new Promise(resolve => {
            // @ts-ignore
            document.addEventListener("as_boosterData", (e: CustomEvent) => resolve(e.detail), {once: true});
            DOMHelper.insertScript("scriptlet/Community/BoosterCreator/boosterData.js");
        }));

        // Localized string of "(quantifier) + Gems"
        const gemWord = document.querySelector<HTMLElement>(".booster_creator_goostatus .goo_display")!
            .textContent!
            .trim()
            .replace(/[\d]+,?/g, "");

        // TODO what is options param?

        // @ts-ignore
        const options = document.getElementById("booster_game_selector")?.options;
        for (const option of options) {
            const val = option.value;
            if (val) {
                // @ts-ignore
                option.append(` - ${boosterData[val].price} ${gemWord}`);
            }
        }
    }
}
