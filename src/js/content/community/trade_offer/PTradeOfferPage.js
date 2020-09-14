import {CTradeOfferPage} from "./CTradeOfferPage";

import {Localization, SyncedStorage} from "core";

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

    return new CTradeOfferPage().applyFeatures();
})();
