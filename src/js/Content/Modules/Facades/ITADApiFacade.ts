import type {TGetStoreListResponse} from "@Background/Modules/IsThereAnyDeal/_types";
import {BackgroundSender} from "@Core/BackgroundSimple";
import {EAction} from "@Background/EAction";

export default class ITADApiFacade {

    static getStoreList(): Promise<TGetStoreListResponse> {
        return BackgroundSender.send2<TGetStoreListResponse>(EAction.StoreList);
    }
}
