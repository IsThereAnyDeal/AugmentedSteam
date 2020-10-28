import {ExtensionLayer, Feature} from "../../../Modules/content";

export default class FShowGemsCost extends Feature {

    apply() {
        ExtensionLayer.runInPageContext(gemWord => {
            /* eslint-disable no-undef, new-cap, no-invalid-this */
            $J("#booster_game_selector option").each(function() {
                if ($J(this).val()) {
                    $J(this).append(` - ${CBoosterCreator.sm_rgBoosterData[$J(this).val()].price} ${gemWord}`);
                }
            });
            /* eslint-enable no-undef, new-cap, no-invalid-this */
        }, [document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "")]);
    }
}
