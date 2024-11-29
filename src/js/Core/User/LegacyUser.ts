import HTMLParser from "@Core/Html/HtmlParser";
import StringUtils from "@Core/Utils/StringUtils";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
import RequestData from "@Content/Modules/RequestData";
import type UserInterface from "@Core/User/UserInterface";

export default class LegacyUser implements UserInterface {

    private _signedIn: boolean = false;
    private _steamId: string|undefined;
    private _storeCountry: string|undefined;
    private _profileUrl: string|undefined;
    private _profilePath: string|undefined;

    private _sessionId: string|null|undefined;
    private _webApiToken: string|undefined;

    set isSignedIn(value: boolean) {
        this._signedIn = value;
    }

    get isSignedIn(): boolean {
        return this._signedIn;
    }

    set steamId(value: string) {
        this._steamId = value;
    }

    get steamId(): string {
        return this._steamId!;
    }

    set storeCountry(value: string) {
        this._storeCountry = value;
    }

    get storeCountry(): string {
        let country;

        const params = new URLSearchParams(window.location.search);
        if (params.has("cc")) {
            // Support overrides, though this only works when logged out now
            country = params.get("cc");
        } else {
            country = this._storeCountry;
        }

        if (!country) {
            console.warn("Failed to detect store country, falling back to US");
            country = "US";
        }

        return country;
    }

    set profileUrl(value: string) {
        this._profileUrl = value;
    }

    get profileUrl(): string {
        return this._profileUrl!;
    }

    set profilePath(value: string) {
        this._profilePath = value;
    }

    get profilePath(): string {
        return this._profilePath!;
    }

    get sessionId(): string|null {
        if (!this._sessionId) {
            this._sessionId = HTMLParser.getStringVariable("g_sessionID");
        }
        return this._sessionId;
    }

    /*
     * Fetch the user's web api token to use in new style WebAPI calls (Services)
     * https://github.com/Revadike/UnofficialSteamWebAPI/wiki/Get-Points-Summary-Config
     * Works on both store and community, but only returns the store token
     */
    async getWebApiToken(): Promise<string> {
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

