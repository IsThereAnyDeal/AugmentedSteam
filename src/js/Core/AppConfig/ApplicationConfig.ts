import type ApplicationConfigInterface from "./ApplicationConfigInterface";

export default class ApplicationConfig implements ApplicationConfigInterface {

    private _language: string|null = null;
    private _countryCode: string|null = null;
    private _webApiToken: string|null = null;

    public load(): this {
        const configNode: HTMLElement|null = document.querySelector("#application_config");

        if (configNode?.dataset.config) {
            const config = JSON.parse(configNode.dataset.config);
            this._language = config.LANGUAGE;
            this._countryCode = config.COUNTRY;
        }

        if (configNode?.dataset.store_user_config) {
            const storeUserConfig = JSON.parse(configNode.dataset.store_user_config);
            this._webApiToken = storeUserConfig.webapi_token;
        }

        return this;
    }

    get language(): string|null {
        return this._language;
    }

    get countryCode(): string|null {
        return this._countryCode;
    }

    get webApiToken(): string|null {
        return this._webApiToken;
    }
}
