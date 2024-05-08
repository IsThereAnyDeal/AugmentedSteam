import HTMLParser from "@Core/Html/HtmlParser";
import StringUtils from "@Core/Utils/StringUtils";
import {RequestData} from "./RequestData";
import SteamCommunityApiFacade from "@Content/Modules/Facades/SteamCommunityApiFacade";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";

export default class User {

    private static _promise: Promise<void>;

    private static _signedIn: boolean;
    private static _steamId: string;
    private static _storeCountry: string;

    private static _profileUrl: string;
    private static _profilePath: string;

    private static _sessionId: string|null;
    private static _accessToken: string;

    static async promise(): Promise<void> {
        if (!this._promise) {
            this._promise = (async () => {
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

        return this._promise;
    }

    static then(
        onFulfill: ((value: void) => PromiseLike<void>|void),
        onReject: (reason: any) => PromiseLike<never>
    ): Promise<void> {
        return User.promise().then(onFulfill, onReject);
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
     * Retrieve user access token to use in new style WebAPI calls (Services)
     * https://github.com/Revadike/UnofficialSteamWebAPI/wiki/Get-Points-Summary-Config
     */
    static get accessToken(): Promise<string> {
        if (this._accessToken) {
            return Promise.resolve(this._accessToken);
        }

        // This endpoint works on both store and community
        return (async (): Promise<string> => {
            const response = await RequestData.getJson(`${window.location.origin}/pointssummary/ajaxgetasyncconfig`);
            if (!response || !response.success || !response.data.webapi_token) {
                throw new Error("Failed to get webapi token");
            }

            this._accessToken = response.data.webapi_token;
            return this._accessToken;
        })();
    }
}

