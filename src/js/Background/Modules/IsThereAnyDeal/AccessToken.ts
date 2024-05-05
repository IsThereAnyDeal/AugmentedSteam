import LocalStorage from "@Core/Storage/LocalStorage";
import TimeUtils from "@Core/Utils/TimeUtils";

export default class AccessToken {

    private static loadPromise: Promise<string|null>|undefined = undefined;

    static load(): Promise<string|null> {
        if (!this.loadPromise) {
            this.loadPromise = (async () => {
                const data = await LocalStorage.get("access_token");
                if (!data) {
                    return null;
                }

                if (TimeUtils.isInPast(data.expiry)) {
                    await LocalStorage.remove("access_token");
                    return null;
                }

                return data.token;
            })();
        }

        return this.loadPromise;
    }

    static async create(token: string, expiresIn: number) {
        await LocalStorage.set("access_token", {
            token: token,
            expiry: TimeUtils.now() + expiresIn
        })
        this.loadPromise = undefined;
    }

    static async clear(): Promise<void> {
        await LocalStorage.remove("access_token");
        this.loadPromise = undefined;
    }
}
