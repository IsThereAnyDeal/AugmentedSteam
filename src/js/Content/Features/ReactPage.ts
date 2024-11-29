import Page from "@Content/Features/Page";
import TimeUtils from "@Core/Utils/TimeUtils";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import type Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import AppConfigFactory from "@Core/AppConfig/AppConfigFactory";
import LanguageFactory from "@Core/Localization/LanguageFactory";
import UserFactory from "@Core/User/UserFactory";
import type AppConfig from "@Core/AppConfig/AppConfig";
import ProgressBar from "@Content/Modules/Widgets/ProgressBar";
import AugmentedSteam from "@Content/Modules/AugmentedSteam";
import ChangelogHandler from "@Core/Update/ChangelogHandler";
import ITAD from "@Content/Modules/ITAD";
import ReactDOM from "@Content/Steam/ReactDOM";

export default class ReactPage extends Page {
    public async hydration(timeout: number=30): Promise<this> {
        const that = this;
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
                    resolve(that);
                    console.log("Hydration complete");
                    console.groupEnd();
                    break;
                }
                await TimeUtils.timer(20);
            }
        });
    }

    protected override check(): boolean {
        return !!ReactDOM.globalHeader();
    }

    protected override getAppConfig(factory: AppConfigFactory): Promise<AppConfig> {
        return factory.createFromReact();
    }

    protected override async getLanguage(factory: LanguageFactory): Promise<Language | null> {
        return factory.createFromReact();
    }

    protected override getUser(factory: UserFactory): Promise<UserInterface> {
        return factory.createFromReact();
    }

    protected override async preApply(language: Language | null, user: UserInterface): Promise<void> {
        ProgressBar.buildReact();
        await (new AugmentedSteam(language, user, true))
            .build();

        await ChangelogHandler.checkVersion();
        await ITAD.init(user);
    }
}
