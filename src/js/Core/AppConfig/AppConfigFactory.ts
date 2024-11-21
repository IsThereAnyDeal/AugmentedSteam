import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import AppConfig, {type AppConfigData} from "@Core/AppConfig/AppConfig";

export default class AppConfigFactory {

    public createFromLegacy(): AppConfig {
        const configNode: HTMLElement|null = document.querySelector("#application_config");

        const data: AppConfigData = {};

        if (configNode?.dataset.config) {
            const config = JSON.parse(configNode.dataset.config);
            data.language = config.LANGUAGE;
            data.countryCode = config.COUNTRY;
        }

        if (configNode?.dataset.store_user_config) {
            const storeUserConfig = JSON.parse(configNode.dataset.store_user_config);
            data.webApiToken = storeUserConfig.webapi_token;
        }

        return new AppConfig(data);
    }

    public async createFromReact(): Promise<AppConfig> {

        const [loaderData, Config, UserConfig] = await Promise.all([
            SteamFacade.global("SSR.loaderData"),
            SteamFacade.global("Config"),
            SteamFacade.global("UserConfig")
        ]);

        const data: AppConfigData = {
            language: Config.LANGUAGE,
            countryCode: Config.COUNTRY
        }

        if (Array.isArray(loaderData) && loaderData[0]) {
            for (let item of loaderData) {
                item = JSON.parse(item);
                if (item.strWebAPIToken) {
                    data.webApiToken = item.strWebAPIToken;
                }

                if (item.storeBrowseContext && item.steamid) { // find correct object
                    data.steamId = item.steamid;
                }
            }
        }
        return new AppConfig(data);
    }
}