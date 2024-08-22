/**
 * @contentScript
 * @match *://steamcommunity.com/tradeoffer/*
 */

import CTradeOffer from "./CTradeOffer";
import Localization from "@Core/Localization/Localization";
import {SettingsStore} from "@Options/Data/Settings";

(async function() {

    try {
        await SettingsStore.init();
        await Localization.init();
    } catch (err) {
        console.group("Augmented Steam initialization");
        console.error("Failed to initialize Augmented Steam");
        console.error(err);
        console.groupEnd();

        return;
    }

    (new CTradeOffer()).applyFeatures();
})();
