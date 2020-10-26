import {Localization, SyncedStorage} from "../../core_modules";
import {Common, Currency, User} from "common";

export default async function(Context) {

    if (!document.getElementById("global_header")) { return; }

    try {

        // TODO What errors can be "suppressed" here?
        await SyncedStorage.init().catch(err => { console.error(err); });
        await Promise.all([Localization, User, Currency]);
    } catch (err) {
        console.group("Augmented Steam initialization");
        console.error("Failed to initiliaze Augmented Steam");
        console.error(err);
        console.groupEnd();

        return;
    }

    Common.init();

    new Context().applyFeatures();
}
