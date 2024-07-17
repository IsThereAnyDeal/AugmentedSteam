import Config from "config";
import browser, {type Tabs, type WebRequest} from "webextension-polyfill";
import AccessToken from "@Background/Modules/IsThereAnyDeal/AccessToken";

type Tab = Tabs.Tab;
type OnUpdatedChangeInfoType = Tabs.OnUpdatedChangeInfoType;
type OnRemovedRemoveInfoType = Tabs.OnRemovedRemoveInfoType;

export default class Authorization {

    private readonly RedirectURI = "https://isthereanydeal.com/connectaugmentedsteam";

    private generateString(length: number): string {
        const source = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.~";
        let arr = new Uint8Array(length);
        crypto.getRandomValues(arr)
        return arr.reduce((result, value) => result + source.charAt(Math.floor(value % source.length)), "");
    }

    private async sha256(str: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);

        let sha256Buffer = await crypto.subtle.digest("SHA-256", data);
        return String.fromCharCode(...new Uint8Array(sha256Buffer))
    }

    private base64url(str: string): string {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    private async getResponseUrl(authTabId: number): Promise<URL> {
        return new Promise<URL>((resolve, reject) => {
            const updateListener = (tabId: number, changeInfo: OnUpdatedChangeInfoType, _tab: Tab): void => {
                if (tabId !== authTabId) {
                    return;
                }

                if (!changeInfo.url?.startsWith(this.RedirectURI)) {
                    return;
                }

                browser.tabs.onUpdated.removeListener(updateListener);
                browser.tabs.onRemoved.removeListener(removeListener);
                browser.tabs.remove(tabId);
                resolve(new URL(changeInfo.url!));
            }

            const removeListener = (tabId: number, _removeInfo: OnRemovedRemoveInfoType): void => {
                if (tabId !== authTabId) {
                    return;
                }

                browser.tabs.onUpdated.removeListener(updateListener);
                browser.tabs.onRemoved.removeListener(removeListener);
                reject();
            }

            browser.tabs.onUpdated.addListener(updateListener);
            browser.tabs.onRemoved.addListener(removeListener);
        });
    }

    async authorize(scope: string[]) {
        const verifier = this.generateString(64);
        const state = this.generateString(30);

        const authUrl = new URL(`${Config.ITADServer}/oauth/authorize/`);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", Config.ITADClientId);
        authUrl.searchParams.set("redirect_uri", this.RedirectURI);
        authUrl.searchParams.set("scope", scope.join(" "));
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("code_challenge", this.base64url(await this.sha256(verifier)));
        authUrl.searchParams.set("code_challenge_method", "S256");

        const tab = await browser.tabs.create({"url": authUrl.toString()});
        if (!tab.id) {
            throw new Error("Missing tab id");
        }

        const responseUrl = await this.getResponseUrl(tab.id);

        if (responseUrl.searchParams.get("state") !== state) {
            throw new Error("Failed to verify state parameter from URL fragment");
        }

        const code = responseUrl.searchParams.get("code");
        if (!code) {
            throw new Error("Failed to receive code");
        }

        const tokenUrl = new URL("oauth/token/", Config.ITADServer);
        const params = new URLSearchParams();
        params.set("grant_type", "authorization_code");
        params.set("client_id", Config.ITADClientId);
        params.set("redirect_uri", this.RedirectURI);
        params.set("code", code);
        params.set("code_verifier", verifier);

        let response = await fetch(tokenUrl, {
            method: "POST",
            body: params
        });
        const tokens = await response.json() as {access_token: string, expires_in: number};

        const accessToken = tokens.access_token;
        const expiresIn = tokens.expires_in;

        if (!accessToken || !expiresIn) {
            throw new Error(`Authorization failed`);
        }

        await AccessToken.create(accessToken, Number(expiresIn));
    }
}
