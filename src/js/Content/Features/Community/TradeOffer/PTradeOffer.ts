/**
 * @contentScript
 * @match *://steamcommunity.com/tradeoffer/*
 */

import CTradeOffer from "./CTradeOffer";
import "../../../../../css/community/tradeoffer.css"
import Localization from "@Core/Localization/Localization";

(async function() {

    try {
        await Localization;
    } catch (err) {
        console.group("Augmented Steam initialization");
        console.error("Failed to initialize Augmented Steam");
        console.error(err);
        console.groupEnd();

        return;
    }

    (new CTradeOffer()).applyFeatures();
})();
