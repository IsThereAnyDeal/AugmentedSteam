import {Info, Localization, SyncedStorage} from "../core_modules";
import {
    AugmentedSteam, Background,
    CurrencyManager,
    DOMHelper,
    EarlyAccess,
    ITAD, Messenger, ProgressBar,
    Sortbox,
    UpdateHandler,
    User
} from "../Modules/content";

/**
 * Event handler for uncaught Background errors
 */
function unhandledrejection(ev) {
    const err = ev.reason;
    if (!err || !err.error) { return; } // Not a background error
    ev.preventDefault();
    ev.stopPropagation();
    console.group("An error occurred in the background context.");
    console.error(err.localStack);
    console.error(err.stack);
    console.groupEnd();
}
window.addEventListener("unhandledrejection", unhandledrejection);

/**
 *  Inject the Messenger class into the DOM, providing the same interface for the page context side
 */
DOMHelper.insertScript({"content": `window.Messenger = ${Messenger.toString()}`});

Background.registerErrorHandler(({name, msg}) => {
    if (name !== "LoginError") { return false; }

    AugmentedSteam.addLoginWarning(msg);
    ProgressBar.finishRequest();
    return true;
});

class Page {

    async run(ContextRef) {
        if (!document.getElementById("global_header")) { return; }

        const context = new ContextRef();

        try {

            // TODO What errors can be "suppressed" here?
            await SyncedStorage.init().catch(err => { console.error(err); });
            await Promise.all([Localization, User, CurrencyManager.init(context)]);
        } catch (err) {
            console.group("Augmented Steam initialization");
            console.error("Failed to initiliaze Augmented Steam");
            console.error(err);
            console.groupEnd();

            return;
        }

        console.log(
            `%c Augmented %cSteam v${Info.version} %c https://es.isthereanydeal.com/`,
            "background: #000000; color: #046eb2",
            "background: #000000; color: #ffffff",
            "",
        );

        AugmentedSteam.init(context);
        UpdateHandler.checkVersion(context, AugmentedSteam.clearCache);
        EarlyAccess.showEarlyAccess();
        ITAD.create();
        Sortbox.init();
        this.pageSpecificFeatures();

        context.applyFeatures();
    }

    _pageSpecificFeatures() {
        // left for overrides
    }
}

export {Page};
