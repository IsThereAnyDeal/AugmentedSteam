import Environment from "@Core/Environment";

export default class CookieReader {

    private static cache: Map<string, string>|null;

    private static load(): void {
        this.cache = new Map<string, string>();

        if (!Environment.isBackgroundScript() && typeof document !== "undefined") {
            for (let [key, val] of <[string, string][]>document.cookie.split(";").map(kv => kv.split("=", 2))) {
                key = key.trim();
                this.cache.set(key, decodeURIComponent(val));
            }
        }
    }

    static get(name: string, defaultValue: string|null = null): string|null {
        if (this.cache === null) {
            this.load();
        }
        return this.cache!.get(name.trim()) ?? defaultValue;
    }
}
