import {
    BackgroundSimple, CookieStorage, ErrorParser, ExtensionResources, GameId, HTML, HTMLParser,
    Info, Language, LocalStorage, Localization, StringUtils, SyncedStorage, Version
} from "../core_modules";

/**
 * Common functions that may be used on any pages
 */

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

// Inject the Messenger class into the DOM, providing the same interface for the page context side
DOMHelper.insertScript({"content": `window.Messenger = ${Messenger.toString()}`});


Background.registerErrorHandler(({name, msg}) => {
    if (name !== "LoginError") { return false; }

    AugmentedSteam.addLoginWarning(msg);
    ProgressBar.finishRequest();

    return true;
});


export class Common {

    static init() {

        console.log(
            `%c Augmented %cSteam v${Info.version} %c https://es.isthereanydeal.com/`,
            "background: #000000; color: #046eb2",
            "background: #000000; color: #ffffff",
            "",
        );

        ProgressBar.create();
        ProgressBar.loading();
        UpdateHandler.checkVersion(AugmentedSteam.clearCache);
        AugmentedSteam.addBackToTop();
        AugmentedSteam.addMenu();
        AugmentedSteam.addLanguageWarning();
        AugmentedSteam.handleInstallSteamButton();
        AugmentedSteam.removeAboutLinks();
        EarlyAccess.showEarlyAccess();
        AugmentedSteam.disableLinkFilter();
        AugmentedSteam.skipGotSteam();
        AugmentedSteam.keepSteamSubscriberAgreementState();
        AugmentedSteam.defaultCommunityTab();
        AugmentedSteam.horizontalScrolling();
        ITAD.create();

        if (User.isSignedIn) {
            AugmentedSteam.addUsernameSubmenuLinks();
            AugmentedSteam.addRedeemLink();
            AugmentedSteam.replaceAccountName();
            AugmentedSteam.launchRandomButton();
            AugmentedSteam.bindLogout();
        }
    }
}

Sortbox.init();
