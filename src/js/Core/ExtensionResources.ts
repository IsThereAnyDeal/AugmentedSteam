import browser from "webextension-polyfill";

export default class ExtensionResources {

    static getURL(pathname: string) {
        return browser.runtime.getURL(pathname);
    }

    static get(pathname: string): Promise<Response> {
        return fetch(ExtensionResources.getURL(pathname));
    }

    static async getJSON<T>(pathname: string): Promise<T> {
        let response = await ExtensionResources.get(pathname);
        return await response.json();
    }

    static async getText(pathname: string): Promise<string> {
        let response = await ExtensionResources.get(pathname);
        return await response.text();
    }
}
