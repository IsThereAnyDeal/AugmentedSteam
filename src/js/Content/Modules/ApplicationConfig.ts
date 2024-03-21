export default class ApplicationConfig {

    private static loaded: boolean = false

    private static config: Record<string, any>;
    private static userInfo: Record<string, any>;
    private static storeUserConfig: Record<string, any>;

    private static loadConfig() {
        if (this.loaded) {
            return;
        }

        const configNode: HTMLElement|null = document.querySelector("#application_config");
        if (!configNode) {
            throw new Error("Could not find config node");
        }

        if (!configNode.dataset.config) {
            throw new Error("Could not find config");
        }
        this.config = JSON.parse(configNode.dataset.config);

        if (!configNode.dataset.userinfo) {
            throw new Error("Could not find userinfo");
        }
        this.userInfo = JSON.parse(configNode.dataset.userinfo);

        if (!configNode.dataset.store_user_config) {
            throw new Error("Could not find store_user_config");
        }
        this.storeUserConfig = JSON.parse(configNode.dataset.store_user_config);
    }

    static language(): string {
        this.loadConfig();
        return this.config.LANGUAGE;
    }

    static countryCode(): string {
        this.loadConfig();
        return this.userInfo.country_code;
    }

    static webApiToken(): string {
        this.loadConfig();
        return this.storeUserConfig.webapi_token;
    }
}
