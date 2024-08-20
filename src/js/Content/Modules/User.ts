import HTMLParser from "@Core/Html/HtmlParser";
import StringUtils from "@Core/Utils/StringUtils";
import SteamCommunityApiFacade from "@Content/Modules/Facades/SteamCommunityApiFacade";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
import RequestData from "@Content/Modules/RequestData";

export default class User {

    private static promise: Promise<void>;

    private static _signedIn: boolean;
    private static _steamId: string;
    private static _storeCountry: string;

    private static _profileUrl: string;
    private static _profilePath: string;

    private static _sessionId: string|null;
    private static _webApiToken: string;

    private static init(): Promise<void> {
        if (!this.promise) {
            this.promise = (async () => {
                const avatarNode = document.querySelector<HTMLAnchorElement>("#global_actions > a.user_avatar");

                try {
                    if (avatarNode) {
                        this._profileUrl = avatarNode.href;
                        this._profilePath = avatarNode.pathname;

                        const login = await SteamCommunityApiFacade.login(this._profilePath);
                        this._signedIn = true;
                        this._steamId = login.steamId;
                    } else {
                        await SteamCommunityApiFacade.logout();
                    }
                } catch(e) {
                    console.log(e);
                }

                try {
                    let country = await SteamCommunityApiFacade.getStoreCountry();
                    if (country) {
                        this._storeCountry = country;
                        return;
                    }

                    let newCountry: string|null = null;

                    // Check config first since it's the fastest and present on most pages
                    const config = document.querySelector<HTMLElement>("#webui_config, #application_config");
                    if (config) {
                        newCountry = config.dataset.config
                            ? JSON.parse(config.dataset.config).COUNTRY
                            : null;
                    } else if (window.location.hostname === "steamcommunity.com") {
                        // This variable is present on market-related pages
                        newCountry = HTMLParser.getStringVariable("g_strCountryCode");
                    } else {
                        newCountry = HTMLParser.getStringVariable(/GDynamicStore\.Init\(.+?,\s*'([A-Z]{2})'/);
                    }

                    if (!newCountry) {
                        throw new Error("Script with user store country not found");
                    }

                    User._storeCountry = newCountry;
                    await SteamCommunityApiFacade.setStoreCountry(newCountry);
                } catch(e) {
                    console.group("Store country detection");
                    console.warn("Failed to detect store country from page");
                    console.error(e);
                    console.groupEnd();
                }
            })();
        }

        return this.promise;
    }

    private static then(onDone: (value: void) => void|Promise<void>): Promise<void> {
        return User.init().then(onDone);
    }

    static get isSignedIn(): boolean {
        return this._signedIn;
    }

    static get steamId(): string {
        return this._steamId;
    }

    static get storeCountry(): string {
        let country;

        const params = new URLSearchParams(window.location.search);
        if (params.has("cc")) {
            // Support overrides, though this only works when logged out now
            country = params.get("cc");
        } else {
            country = User._storeCountry;
        }

        if (!country) {
            console.warn("Failed to detect store country, falling back to US");
            country = "US";
        }

        return country;
    }

    static get profileUrl(): string {
        return this._profileUrl;
    }

    static get profilePath(): string {
        return this._profilePath;
    }

    static get sessionId(): string|null {
        if (!this._sessionId) {
            this._sessionId = HTMLParser.getStringVariable("g_sessionID");
        }
        return this._sessionId;
    }

    static getPurchaseDate(lang: string, appName: string): Promise<string|null> {
        const _appName = StringUtils.clearSpecialSymbols(appName);
        return SteamStoreApiFacade.getPurchaseDate(_appName, lang);
    }

    /*
     * Fetch the user's web api token to use in new style WebAPI calls (Services)
     * https://github.com/Revadike/UnofficialSteamWebAPI/wiki/Get-Points-Summary-Config
     * Works on both store and community, but only returns the store token
     */
    static async getWebApiToken(): Promise<string> {
        if (!this._webApiToken) {
            const response = await RequestData.getJson<{
                success?: boolean,
                data?: {
                    webapi_token?: string
                }
            }>(`${window.location.origin}/pointssummary/ajaxgetasyncconfig`);

            if (!response.success || !response.data?.webapi_token) {
                throw new Error("Failed to get webapi token");
            }

            this._webApiToken = response.data.webapi_token;
        }

        return this._webApiToken;
    }
}

