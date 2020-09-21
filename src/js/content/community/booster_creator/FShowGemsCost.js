import {ASFeature} from "modules";

import {ExtensionLayer} from "common";

export class FShowGemsCost extends ASFeature {

    apply() {
        ExtensionLayer.runInPageContext(gemWord => {
            $J("#booster_game_selector option").each(function() {
                if ($J(this).val()) {
                    $J(this).append(` - ${CBoosterCreatorPage.sm_rgBoosterData[$J(this).val()].price} ${gemWord}`);
                }
            });
        }, [document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "")]);
    }
}
