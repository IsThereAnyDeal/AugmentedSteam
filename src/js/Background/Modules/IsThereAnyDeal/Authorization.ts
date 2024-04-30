import Config from "../../../config";
import browser, {type WebRequest} from "webextension-polyfill";
import AccessToken from "@Background/Modules/IsThereAnyDeal/AccessToken";

export default class Authorization {

    private generateString(length: number): string {
        const source = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.~";
        let arr = new Uint8Array(length);
        window.crypto.getRandomValues(arr)
        return arr.reduce((result, value) => result + source.charAt(Math.floor(value % source.length)), "");
    }

    private async sha256(str: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);

        let sha256Buffer = await window.crypto.subtle.digest("SHA-256", data);
        return String.fromCharCode(...new Uint8Array(sha256Buffer))
    }

    private base64url(str: string): string {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    private async getResponseUrl(redirectURI: string, listenedTabId: number) {

        const url: string = await new Promise((resolve, reject) => {
            function webRequestListener(details: WebRequest.OnBeforeRequestDetailsType): WebRequest.BlockingResponse {
                resolve(details.url);

                clearListeners();
                browser.tabs.remove(listenedTabId);

                return {"cancel": true};
            }

            function tabsListener(tabId: number) {
                if (tabId === listenedTabId) {
                    reject(new Error("Authorization tab closed"));
                    clearListeners();
                }
            }

            function clearListeners() {
                browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
                browser.tabs.onRemoved.removeListener(tabsListener);
            }

            browser.tabs.onRemoved.addListener(tabsListener);
            browser.webRequest.onBeforeRequest.addListener(
                webRequestListener,
                {
                    "urls": [
                        redirectURI, // For Chrome, seems to not support match patterns (a problem with the Polyfill?)
                        `${redirectURI}/?*` // For Firefox
                    ],
                    "tabId": listenedTabId
                },
                ["blocking"]
            );
        });

        return new URL(url);
    }

    async authorize(scope: string[]) {
        const redirectURI = "https://isthereanydeal.com/connectaugmentedsteam";

        const verifier = this.generateString(64);
        const state = this.generateString(30);

        const authUrl = new URL(`${Config.ITADServer}/oauth/authorize/`);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", Config.ITADClientId);
        authUrl.searchParams.set("redirect_uri", redirectURI);
        authUrl.searchParams.set("scope", scope.join(" "));
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("code_challenge", this.base64url(await this.sha256(verifier)));
        authUrl.searchParams.set("code_challenge_method", "S256");

        const tab = await browser.tabs.create({"url": authUrl.toString()});
        if (!tab.id) {
            throw new Error("Missing tab id");
        }

        const responseUrl = await this.getResponseUrl(redirectURI, tab.id);

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
        params.set("redirect_uri", redirectURI);
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
