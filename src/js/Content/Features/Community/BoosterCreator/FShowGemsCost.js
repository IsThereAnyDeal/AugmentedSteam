import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FShowGemsCost extends Feature {

    async apply() {

        const boosterData = await Page.runInPageContext(
            () => JSON.parse(JSON.stringify(window.CBoosterCreatorPage.sm_rgBoosterData)),
            null,
            true,
        );

        // Localized string of "(quantifier) + Gems"
        const gemWord = document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "");

        const options = document.getElementById("booster_game_selector").options;
        for (const option of options) {
            const val = option.value;
            if (val) {
                option.append(` - ${boosterData[val].price} ${gemWord}`);
            }
        }
    }
}
