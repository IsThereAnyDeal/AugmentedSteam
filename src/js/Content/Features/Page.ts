import bootstrapDomPurify from "../../bootstrapDomPurify";
import Config from "config";
import Info from "@Core/Info";
import Localization from "@Core/Localization/Localization";
import {SettingsStore} from "@Options/Data/Settings";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import Environment, {ContextType} from "@Core/Environment";
import Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import type AppConfig from "@Core/AppConfig/AppConfig";
import LanguageFactory from "@Core/Localization/LanguageFactory";
import UserFactory from "@Core/User/UserFactory";
import AppConfigFactory from "@Core/AppConfig/AppConfigFactory";

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

interface ContextClass {
    create: (params: ContextParams) => Promise<InstanceType<typeof Context>|null>,
    new(params: ContextParams, ...rest: any[]): InstanceType<typeof Context>
}

export default abstract class Page {

    constructor(
        private readonly contextClass: ContextClass
    ) {}

    /**
     * Run any kind of checks we might need to do, to see if the page is properly loaded
     */
    protected abstract check(): boolean;
    protected abstract preApply(language: Language|null, user: UserInterface): Promise<void>

    protected abstract getAppConfig(factory: AppConfigFactory): Promise<AppConfig>;
    protected abstract getLanguage(factory: LanguageFactory): Promise<Language|null>;
    protected abstract getUser(factory: UserFactory): Promise<UserInterface>;

    private async waitForCheck(timeout = 10000): Promise<boolean> {
        if (this.check()) { return true; }

        return new Promise(resolve => {
            const observer = new MutationObserver(() => {
                if (!this.check()) { return; }

                window.clearTimeout(timeoutId);
                observer.disconnect();
                resolve(true);
            });
            const timeoutId = window.setTimeout(() => {
                observer.disconnect();
                resolve(false);
            }, timeout);

            observer.observe(document.documentElement, {childList: true, subtree: true});
        });
    }

    async run(): Promise<void> {
        if (document.querySelector("#as-menu")) {
            // already loaded
            return;
        }
        if (!await this.waitForCheck()) { return; }

        let language: Language|null;
        let user: UserInterface;

        // TODO What errors can be "suppressed" here?
        try {
            await SettingsStore.init();
            await bootstrapDomPurify();
        } catch (err) {
            console.error(err);
        }

        try {
            const appFactory = new AppConfigFactory();
            const appConfig = await this.getAppConfig(appFactory);

            const languageFactory = new LanguageFactory(appConfig);
            language = await this.getLanguage(languageFactory);

            const userFactory = new UserFactory(appConfig);
            user = await this.getUser(userFactory);

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

        await this.preApply(language, user);

        const params = {language, user};
        const context: Context = await this.contextClass.create(params)
            ?? new (this.contextClass)(params);
        await context.applyFeatures();
    }
}
