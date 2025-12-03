import { EAction } from "@Background/EAction";
import type { TVaporLensResponse } from "@Background/Modules/VaporLens/_types";
import Background from "@Core/Background";

export default class VaporLensApiFacade {

    static fetchInsights(appid: number): Promise<TVaporLensResponse|null> {
        return Background.send<TVaporLensResponse|null>(EAction.VaporLens_FetchInsights, { appid });
    }
}
