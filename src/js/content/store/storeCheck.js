import { SyncedStorage } from "../../core.js";
import { User, Currency, Common } from "../common.js";
import { Localization } from "../../language.js";

export default async function(context) {

    if (!document.getElementById("global_header")) { return; }

    try {
        // TODO What errors can be "suppressed" here?
        await SyncedStorage.init().catch(err => { console.error(err); });
        await Promise.all([Localization, User, Currency]);
    } catch(err) {
        console.group("Augmented Steam initialization")
        console.error("Failed to initiliaze Augmented Steam");
        console.error(err);
        console.groupEnd();

        return;
    }

    Common.init();

    return new context().applyFeatures();
}

(async function(){
    switch (true) {
        case /\bagecheck\b/.test(path):
            AgeCheck.sendVerification();
            break;
    }
});
// Intentionally not called
