import bootstrapDomPurify from "../../bootstrapDomPurify";
import config from "../../config";
import {Info} from "@Core/Info";
import Localization from "@Core/Localization/Localization";
import {SettingsStore} from "@Options/Data/Settings";
import ProgressBar from "@Content/Modules/Widgets/ProgressBar";
import DOMHelper from "@Content/Modules/DOMHelper";
import AugmentedSteam from "@Content/Modules/AugmentedSteam";
import User from "@Content/Modules/User";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import UpdateHandler from "@Content/Modules/UpdateHandler";
import ITAD from "@Content/Modules/ITAD";
import type Context from "@Content/Modules/Context/Context";

/**
 * Event handler for uncaught Background errors
 */
function unhandledrejection(e: PromiseRejectionEvent) {
    const err = e.reason;
    if (!err || !err.error) {
        return;
    } // Not a background error

    e.preventDefault();
    e.stopPropagation();
    console.group("An error occurred in the background context.");
    console.error(err.stack);
    console.groupEnd();
}
window.addEventListener("unhandledrejection", unhandledrejection);

/**
 *  Inject the SteamFacade class into the DOM, providing the same interface for the page context side
 *  TODO insert directly via manifest with "world": "MAIN"?
 */
DOMHelper.insertScript("scriptlets/SteamScriptlet.js");

export default class Page {

    async run(context: () => Context): Promise<void> {
        if (!document.getElementById("global_header")) { return; }

        try {
            // TODO What errors can be "suppressed" here?
            try {
                await SettingsStore;
                await bootstrapDomPurify();
            } catch (err) {
                console.error(err);
            }

            await Promise.all([Localization, User, CurrencyManager]);
        } catch (err) {
            console.group("Augmented Steam initialization");
            console.error("Failed to initialize Augmented Steam");
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

        ProgressBar();
        AugmentedSteam.init();
        await UpdateHandler.checkVersion(AugmentedSteam.clearCache);
        await ITAD.init();
        await context().applyFeatures();
    }
}
