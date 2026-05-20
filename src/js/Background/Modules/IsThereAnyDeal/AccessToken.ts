import LocalStorage from "@Core/Storage/LocalStorage";
import TimeUtils from "@Core/Utils/TimeUtils";

export default class AccessToken {

    static async load(): Promise<string|null> {
        const data = await LocalStorage.get("access_token");
        return data && TimeUtils.isInFuture(data.expiry) ? data.token : null;
    }

    static async isExpired(): Promise<boolean> {
        const data = await LocalStorage.get("access_token");
        return typeof data !== "undefined" && TimeUtils.isInPast(data.expiry);
    }

    static async create(token: string, expiresIn: number) {
        await LocalStorage.set("access_token", {
            token: token,
            expiry: TimeUtils.now() + expiresIn
        })
    }

    static async clear(): Promise<void> {
        await LocalStorage.remove("access_token");
    }
}
