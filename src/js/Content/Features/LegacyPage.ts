import Page from "@Content/Features/Page";
import LanguageFactory from "@Core/Localization/LanguageFactory";
import UserFactory from "@Core/User/UserFactory";
import AppConfigFactory from "@Core/AppConfig/AppConfigFactory";
import type AppConfig from "@Core/AppConfig/AppConfig";
import type Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import ProgressBar from "@Content/Modules/Widgets/ProgressBar";
import AugmentedSteam from "@Content/Modules/AugmentedSteam";
import ChangelogHandler from "@Core/Update/ChangelogHandler";
import ITAD from "@Content/Modules/ITAD";

export default class LegacyPage extends Page {

    override check(): boolean {
        return !!document.getElementById("global_header");
    }

    protected override async getAppConfig(factory: AppConfigFactory): Promise<AppConfig> {
        return factory.createFromLegacy();
    }

    protected override async getLanguage(factory: LanguageFactory): Promise<Language|null> {
       return factory.createFromLegacy();
    }

    protected override getUser(factory: UserFactory): Promise<UserInterface> {
        return factory.createFromLegacy();
    }

    protected override async preApply(language: Language|null, user: UserInterface): Promise<void> {
        ProgressBar.buildLegacy();

        await (new AugmentedSteam(language, user, false))
            .build();

        await ChangelogHandler.checkVersion();
        await ITAD.init(user);
    }
}
