import Background from "@Core/Background";
import {EAction} from "@Background/EAction";

export default class SessionCacheApiFacade {

    static set<T>(prefix: string, key: string, value: T): Promise<void> {
        return Background.send<void>(EAction.SessionCacheSet, {prefix, key, value});
    }

    static get<T>(prefix: string, key: string): Promise<T|null> {
        return Background.send<T|null>(EAction.SessionCacheGet, {prefix, key});
    }
}
