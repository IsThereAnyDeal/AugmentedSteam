import type {TGetStoreListMessage, TGetStoreListResponse} from "@Background/Modules/IsThereAnyDeal/_types";
import {BackgroundSender} from "@Core/BackgroundSimple";

export default class ITADApiFacade {

    static getStoreList(): Promise<TGetStoreListResponse> {
        return BackgroundSender.send<TGetStoreListMessage, TGetStoreListResponse>({
            action: "itad.storelist"
        });
    }
}
