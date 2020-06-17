import { SyncedStorage } from "../core.js";
import { User, Currency, Common } from "./common.js";
import { Localization } from "../language.js";

export async function storeCheck() {

    if (!document.getElementById("global_header")) { return false; }

    await SyncedStorage.init().catch(err => { console.error(err); });
    await Promise.all([Localization, User, Currency]);

    Common.init();

    return true;
}

(async function(){
    switch (true) {
        case /\bagecheck\b/.test(path):
            AgeCheck.sendVerification();
            break;

        case /^\/app\/.*/.test(path):
            new CAppPage();
            break;

        case /^\/sub\/.*/.test(path):
            new CSubPage();
            break;

        case /^\/bundle\/.*/.test(path):
            new CBundlePage();
            break;

        case /^\/account\/registerkey(\/.*)?$/.test(path):
            new CRegisterKeyPage();
            return;

        case /^\/account(\/)?$/.test(path):
            new CAccountPage();
            return;

        // Match URLs like https://store.steampowered.com/steamaccount/addfundskjdsakjdsakjkjsa since they are still valid
        case /^\/(steamaccount\/addfunds|digitalgiftcards\/selectgiftcard(\/.*)?$)/.test(path):
            new CFundsPage();
            break;

        case /^\/search(\/.*)?$/.test(path):
            new CSearchPage();
            break;

        case /^\/stats(\/.*)?$/.test(path):
            new CStatsPage();
            break;

        case /^\/sale\/.*/.test(path):
            new CSalePage();
            break;

        case /^\/wishlist\/(?:id|profiles)\/.+(\/.*)?/.test(path):
            new CWishlistPage();
            break;
    }
});
// Intentionally not called
