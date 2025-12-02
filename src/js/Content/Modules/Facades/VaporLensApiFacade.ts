import { EAction } from "@Background/EAction";
import type { VaporLensResponse } from "@Content/Features/Store/App/VaporLens.types";
import Background from "@Core/Background";

export default class VaporLensApiFacade {
    static fetchInsights(appid: number): Promise<VaporLensResponse> {
        return Background.send<VaporLensResponse>(EAction.VaporLens, { appid });
    }
}
