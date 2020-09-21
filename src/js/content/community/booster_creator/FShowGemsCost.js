import {Feature} from "modules";

import {ExtensionLayer} from "common";

export default class FShowGemsCost extends Feature {

    apply() {
        ExtensionLayer.runInPageContext(gemWord => {
            $J("#booster_game_selector option").each(function() {
                if ($J(this).val()) {
                    $J(this).append(` - ${CBoosterCreator.sm_rgBoosterData[$J(this).val()].price} ${gemWord}`);
                }
            });
        }, [document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "")]);
    }
}
