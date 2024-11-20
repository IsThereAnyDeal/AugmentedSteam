export default interface UserInterface {

    get isSignedIn(): boolean;
    get steamId(): string;
    get storeCountry(): string;
    get profileUrl(): string;
    get profilePath(): string;
    get sessionId(): string|null;

    getPurchaseDate(lang: string, appName: string): Promise<string|null>;
    getWebApiToken(): Promise<string>;
}

