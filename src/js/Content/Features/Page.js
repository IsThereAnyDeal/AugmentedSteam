import {Info, Localization, SyncedStorage} from "../../modulesCore";
import {
    AugmentedSteam, Background,
    CurrencyManager,
    DOMHelper,
    EarlyAccess,
    ITAD, Messenger, ProgressBar,
    Sortbox,
    UpdateHandler,
    User
} from "../modulesContent";
import {SteamFacade} from "../Modules/SteamFacade";
import setup from "../../setup";
import config from "../../config";

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
 *  Inject the Messenger, SteamFacade class into the DOM, providing the same interface for the page context side
 */
DOMHelper.insertScript({"content": `window.Messenger = ${Messenger.toString()}`});
DOMHelper.insertScript({"content": `window.SteamFacade = ${SteamFacade.toString()}`});

Background.registerErrorHandler(({name, msg}) => {
    if (name !== "LoginError") { return false; }

    AugmentedSteam.addLoginWarning(msg);
    ProgressBar.finishRequest();
    return true;
});

class Page {

    /*
     * NOTE: use cautiously!
     * Run script in the context of the current tab
     */
    static runInPageContext(fun, args, withPromise) {
        const script = document.createElement("script");
        let promise;
        const argsString = Array.isArray(args) ? JSON.stringify(args) : "[]";

        if (withPromise) {
            const msgId = `msg_${++Page._msgCounter}`;
            promise = Messenger.onMessage(msgId);
            script.textContent = `(async () => { Messenger.postMessage("${msgId}", await (${fun})(...${argsString})); })();`;
        } else {
            script.textContent = `(${fun})(...${argsString});`;
        }

        document.documentElement.appendChild(script);
        script.parentNode.removeChild(script);
        return promise;
    }

    async run(ContextClass) {
        if (!document.getElementById("global_header")) { return; }

        try {
            // TODO What errors can be "suppressed" here?
            try {
                await SyncedStorage;
                setup();
            } catch (err) {
                console.error(err);
            }

            await Promise.all([Localization, User, CurrencyManager]);
        } catch (err) {
            console.group("Augmented Steam initialization");
            console.error("Failed to initiliaze Augmented Steam");
            console.error(err);
            console.groupEnd();
            return;
        }

        console.log(
            `%c Augmented %cSteam v${Info.version} %c ${config.PublicHost}`,
            "background: #000000; color: #046eb2",
            "background: #000000; color: #ffffff",
            "",
        );

        ProgressBar.create();
        ProgressBar.loading();
        AugmentedSteam.init();
        UpdateHandler.checkVersion(AugmentedSteam.clearCache);
        EarlyAccess.showEarlyAccess();
        ITAD.create();
        Sortbox.init();
        this._pageSpecificFeatures();

        const context = new ContextClass();
        context.applyFeatures();
    }

    _pageSpecificFeatures() {
        // left for overrides
    }
}
Page._msgCounter = 0;

export {Page};
