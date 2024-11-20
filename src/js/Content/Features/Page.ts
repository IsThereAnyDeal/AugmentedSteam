import bootstrapDomPurify from "../../bootstrapDomPurify";
import Config from "config";
import Info from "@Core/Info";
import Localization from "@Core/Localization/Localization";
import {SettingsStore} from "@Options/Data/Settings";
import ProgressBar from "@Content/Modules/Widgets/ProgressBar";
import AugmentedSteam from "@Content/Modules/AugmentedSteam";
import LegacyUser from "@Core/User/LegacyUser";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import ChangelogHandler from "@Core/Update/ChangelogHandler";
import ITAD from "@Content/Modules/ITAD";
import type Context from "@Content/Modules/Context/Context";
import Environment, {ContextType} from "@Core/Environment";
import LanguageFactory from "@Core/Localization/LanguageFactory";
import ApplicationConfig from "@Core/AppConfig/ApplicationConfig";
import Language from "@Core/Localization/Language";
import UserFactory from "@Core/User/UserFactory";
import type UserInterface from "@Core/User/UserInterface";

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

        let language: Language|null;
        let user: UserInterface;

        try {
            // TODO What errors can be "suppressed" here?
            try {
                await SettingsStore.init();
                await bootstrapDomPurify();
            } catch (err) {
                console.error(err);
            }

            const appConfig = (new ApplicationConfig()).load();

            language = (new LanguageFactory(appConfig)).createFromLegacy();
            user = await (new UserFactory(appConfig)).createFromLegacy();

            await Promise.all([
                Localization.init(language),
                CurrencyManager.init()
            ]);
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
        AugmentedSteam.init(language?.name ?? "english", user);
        await ChangelogHandler.checkVersion();
        await ITAD.init(user);

        const context = new (this.contextClass)();
        context.language = language;
        context.user = user;
        await context.applyFeatures();
    }
}
