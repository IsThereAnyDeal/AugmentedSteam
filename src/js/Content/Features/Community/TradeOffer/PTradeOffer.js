/**
 * @contentScript
 * @match *://steamcommunity.com/tradeoffer/*
 */

import {CTradeOffer} from "./CTradeOffer";
import "../../../../../css/community/tradeoffer.css"

import {Localization, SyncedStorage} from "../../../../modulesCore";

(async function() {

    try {
        await SyncedStorage;
        await Localization;
    } catch (err) {
        console.group("Augmented Steam initialization");
        console.error("Failed to initiliaze Augmented Steam");
        console.error(err);
        console.groupEnd();

        return;
    }

    new CTradeOffer().applyFeatures();
})();
