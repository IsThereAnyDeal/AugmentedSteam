import {Feature} from "../../../Modules/Content";
import {Page} from "../../Page";

export default class FShowGemsCost extends Feature {

    apply() {
        Page.runInPageContext(gemWord => {
            /* eslint-disable no-invalid-this */
            const jq = window.SteamFacade.jq;
            jq("#booster_game_selector option").each(function() {
                const val = jq(this).val();
                if (val) {
                    jq(this).append(` - ${window.SteamFacade.boosterCreatorData()[val].price} ${gemWord}`);
                }
            });
            /* eslint-enable no-invalid-this */
        }, [document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "")]);
    }
}
