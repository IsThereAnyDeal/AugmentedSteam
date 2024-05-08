import BackgroundSender from "@Core/BackgroundSimple";
import {EAction} from "@Background/EAction";

export default class CacheApiFacade {

    static clearCache(): Promise<void> {
        return BackgroundSender.send2<void>(EAction.CacheClear);
    }
}
