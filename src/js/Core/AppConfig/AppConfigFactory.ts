import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import AppConfig from "@Core/AppConfig/AppConfig";

export default class AppConfigFactory {

    public createFromLegacy(): AppConfig {
        const configNode: HTMLElement|null = document.querySelector("#application_config");

        let language: string|null = null;
        let countryCode: string|null = null;
        let webApiToken: string|null = null;

        if (configNode?.dataset.config) {
            const config = JSON.parse(configNode.dataset.config);
            language = config.LANGUAGE;
            countryCode = config.COUNTRY;
        }

        if (configNode?.dataset.store_user_config) {
            const storeUserConfig = JSON.parse(configNode.dataset.store_user_config);
            webApiToken = storeUserConfig.webapi_token;
        }

        return new AppConfig(
            language,
            countryCode,
            webApiToken
        );
    }

    private static async createFromReact(): Promise<AppConfig> {

        const [loaderData, Config, UserConfig] = await Promise.all([
            SteamFacade.global("SSR.loaderData"),
            SteamFacade.global("Config"),
            SteamFacade.global("UserConfig")
        ]);

        let language: string|null = Config.LANGUAGE;
        let countryCode: string|null = Config.COUNTRY;
        let webApiToken: string|null = null;

        if (Array.isArray(loaderData) && loaderData[0]) {
            const data = JSON.parse(loaderData[0]);
            if (data.strWebAPIToken) {
                webApiToken = data.strWebAPIToken;
            }
        }

        return new AppConfig(
            language,
            countryCode,
            webApiToken
        );
    }
}