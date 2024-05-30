import Environment from "@Core/Environment";

export default class CookieReader {

    private static cache: Map<string, string>

    static get(name: string, defaultValue: string|null = null): string|null {
        return this.cache.get(name.trim()) ?? defaultValue;
    }

    static init() {
        this.cache = new Map<string, string>();

        if (!Environment.isBackgroundScript()) {
            if (document) {
                for (let [key, val] of <[string, string][]>document.cookie.split(";").map(kv => kv.split("=", 2))) {
                    key = key.trim();
                    CookieReader.cache.set(key, decodeURIComponent(val));
                }
            }
        }
    }
}

CookieReader.init();
