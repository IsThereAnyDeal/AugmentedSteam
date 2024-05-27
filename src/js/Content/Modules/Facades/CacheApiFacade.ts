import Background from "@Core/Background";
import {EAction} from "@Background/EAction";

export default class CacheApiFacade {

    static clearCache(): Promise<void> {
        return Background.send<void>(EAction.CacheClear);
    }
}
