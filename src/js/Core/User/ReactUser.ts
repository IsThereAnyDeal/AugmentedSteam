import HTMLParser from "@Core/Html/HtmlParser";
import StringUtils from "@Core/Utils/StringUtils";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
import type UserInterface from "@Core/User/UserInterface";

export default class ReactUser implements UserInterface {

    private _signedIn: boolean = false;
    private _steamId: string|undefined;
    private _storeCountry: string|undefined;
    private _profileUrl: string|undefined;
    private _profilePath: string|undefined;
    private _sessionId: string|null|undefined;
    private _webApiToken: string|undefined;

    get isSignedIn(): boolean {
        return !!this._steamId;
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
        return this._storeCountry!;
    }

    get profileUrl(): string {
        return `https://steamcommunity.com${this.profilePath}`
    }

    get profilePath(): string {
        return `/profiles/${this.steamId}/`
    }

    get sessionId(): string|null {
        throw new Error("Not supported");
    }

    set webApiToken(value: string | undefined) {
        this._webApiToken = value;
    }

    async getWebApiToken(): Promise<string> {
        return this._webApiToken!;
    }
}

