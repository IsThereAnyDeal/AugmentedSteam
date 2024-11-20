import bootstrapDomPurify from "../../bootstrapDomPurify";
import Config from "config";
import Info from "@Core/Info";
import Localization from "@Core/Localization/Localization";
import {SettingsStore} from "@Options/Data/Settings";
import ProgressBar from "@Content/Modules/Widgets/ProgressBar";
import AugmentedSteam from "@Content/Modules/AugmentedSteam";
import User from "@Content/Modules/User";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import ChangelogHandler from "@Core/Update/ChangelogHandler";
import ITAD from "@Content/Modules/ITAD";
import type Context from "@Content/Modules/Context/Context";
import Environment, {ContextType} from "@Core/Environment";

Environment.CurrentContext = ContextType.ContentScript;

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

export default class Page {

    constructor(
        private readonly contextClass: new() => Context
    ) {}

    async run(): Promise<void> {
        if (!document.getElementById("global_header")) { return; }

        try {
            // TODO What errors can be "suppressed" here?
            try {
                await SettingsStore.init();
                await bootstrapDomPurify();
            } catch (err) {
                console.error(err);
            }

            await Promise.all([Localization.init(), User.init(), CurrencyManager.init()]);
        } catch (err) {
            console.group("Augmented Steam initialization");
            console.error("Failed to initialize Augmented Steam");
            console.error(err);
            console.groupEnd();
            return;
        }

        console.log(
            `%c Augmented %cSteam v${Info.version} %c ${Config.PublicHost}`,
            "background: #000000; color: #046eb2",
            "background: #000000; color: #ffffff",
            "",
        );

        ProgressBar();
        AugmentedSteam.init();
        await ChangelogHandler.checkVersion();
        await ITAD.init();

        const context = new (this.contextClass)();
        await context.applyFeatures();
    }
}
