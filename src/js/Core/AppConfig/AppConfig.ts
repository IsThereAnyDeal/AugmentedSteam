
export interface AppConfigData {
    language?: string,
    countryCode?: string,
    webApiToken?: string,
    steamId?: string
}

export default class AppConfig {
    public readonly language: string|undefined;
    public readonly countryCode: string|undefined;
    public readonly webApiToken: string|undefined;
    public readonly steamId: string|undefined;

    public constructor(data: AppConfigData) {
        this.language = data.language;
        this.countryCode = data.countryCode;
        this.webApiToken = data.webApiToken;
        this.steamId = data.steamId;
    }
}
