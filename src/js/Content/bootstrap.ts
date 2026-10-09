import Environment, {ContextType} from "@Core/Environment";
import type Language from "@Core/Localization/Language";
import AppConfigFactory from "@Core/AppConfig/AppConfigFactory";
import LanguageFactory from "@Core/Localization/LanguageFactory";
import UserFactory from "@Core/User/UserFactory";
import type UserInterface from "@Core/User/UserInterface";
import {SettingsStore} from "@Options/Data/Settings";
import bootstrapDomPurify from "../bootstrapDomPurify";
import Localization from "@Core/Localization/Localization";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import Config from "config";
import Info from "@Core/Info";
import Feature from "@Content/Modules/Context/Feature";
import Errors from "@Core/Errors/Errors";
import Context, {ContextParams} from "@Content/Modules/Context/Context";
import ProgressBar from "@Content/Modules/Widgets/ProgressBar";
import AugmentedSteam from "@Content/Modules/AugmentedSteam";
import ChangelogHandler from "@Core/Update/ChangelogHandler";
import ITAD from "@Content/Modules/ITAD";
import ReactDOM from "@Content/Steam/ReactDOM";
import TimeUtils from "@Core/Utils/TimeUtils";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

Environment.CurrentContext = ContextType.ContentScript;

/**
 * Event handler for uncaught Background errors
 */
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent)=>  {
    const err = e.reason;
    if (!err || !err.error) {
        return;
    } // Not a background error

    e.preventDefault();
    e.stopPropagation();
    console.group("An error occurred in the background context.");
    console.error(err.stack);
    console.groupEnd();
});

export const enum EBootstrapMode {
    Legacy,
    React
}

async function hydration(timeout: number=30): Promise<void> {
    const start = TimeUtils.now();

    console.group("Augmented Steam, React hydration");
    console.log("Waiting for hydration");
    return new Promise(async (resolve, reject) => {
        while(true) {
            if (timeout && TimeUtils.now() - start > timeout) {
                console.error("Failed to hydrate, timeout");
                console.groupEnd();
                reject();
                return;
            }

            const root = await SteamFacade.globalExists("SSR.reactRoot._internalRoot");
            if (root) {
                /**
                 * Current solution is apparently not enough. Looks like hydration has not yet necessarily
                 * finished when we detect _internalRoot.
                 *
                 * In Wishlist, I noticed that in page features stayed, but header was still _sometimes_ overwritten
                 * by hydration. I'm adding arbitrary timeout for now, but this is not a great solution
                 */
                await TimeUtils.timer(100);
                console.log("Hydration complete");
                resolve();
                console.groupEnd();
                break;
            }
            await TimeUtils.timer(20);
        }
    });
}

export async function bootstrap(config: {
    mode: EBootstrapMode
} = {mode: EBootstrapMode.Legacy}
): Promise<ContextParams> {
    if (config.mode === EBootstrapMode.React) {
        await hydration();
    }

    if (document.querySelector("#as-menu")) {
        // already loaded
        throw new Error("Already loaded");
    }

    // TODO headless mode
    if (config.mode === EBootstrapMode.Legacy) {
        if (document.getElementById("global_header") === null) {
            throw new Error();
        }
    } else {
        if (!ReactDOM.globalHeader()) {
            throw new Error();
        }
    }

    let language: Language|null;
    let user: UserInterface;

    try {
        await SettingsStore.init();
        await bootstrapDomPurify();
    } catch (err) {
        console.error(err);
    }

    try {
        const appFactory = new AppConfigFactory();
        const languageFactory = new LanguageFactory();
        const userFactory = new UserFactory();

        if (config.mode === EBootstrapMode.Legacy) {
            const appConfig = appFactory.createFromLegacy();
            language = languageFactory.createFromLegacy(appConfig.language);
            user = await userFactory.createFromLegacy();
        } else {
            const appConfig = await appFactory.createFromReact();
            language = languageFactory.createFromReact(appConfig.language);
            user = await userFactory.createFromReact(appConfig);
        }

        await Promise.all([
            Localization.init(language),
            CurrencyManager.init()
        ]);
    } catch (err) {
        console.group("Augmented Steam initialization");
        console.error("Failed to initialize Augmented Steam");
        console.error(err);
        console.groupEnd();
        throw new Error();
    }

    console.log(
        `%c Augmented %cSteam v${Info.version} %c ${Config.PublicHost}`,
        "background: #000000; color: #046eb2",
        "background: #000000; color: #ffffff",
        "",
    );

    if (config.mode === EBootstrapMode.Legacy) {
        ProgressBar.buildLegacy();
    } else {
        ProgressBar.buildReact();
    }

    await (new AugmentedSteam(language, user, config.mode === EBootstrapMode.React)).build();
    await ChangelogHandler.checkVersion();
    await ITAD.init(user);

    return new ContextParams(language, user);
}
// shortcuts
export const bootstrapLegacy = () => bootstrap({mode: EBootstrapMode.Legacy});
export const bootstrapReact = () => bootstrap({mode: EBootstrapMode.React});

export async function features<C extends Context>(context: C, features: (typeof Feature<C>)[]) {
    const stats = {
        completed: 0,
        failed: 0
    };

    await Promise.allSettled(features.map(async (f: typeof Feature<C>): Promise<void> => {
        // @ts-expect-error
        const feature = new f(context);

        let pass: boolean = await feature.checkPrerequisites();
        if (!pass) {
            return;
        }

        try {
            await feature.apply();
            ++stats.completed;
        } catch(e) {
            const featureName = feature.name;

            console.group(featureName);
            console.error("Error while applying feature %s", featureName);
            console.error(e);
            console.groupEnd();

            ++stats.failed;
            throw new Errors.FeatureDependencyError("Failed to apply", featureName);
        }
    }));

    console.log(
        "Feature loading complete, %i successfully loaded, %i failed to load",
        stats.completed,
        stats.failed
    );
}
