import { EAction } from "@Background/EAction";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import Api from "@Background/Modules/Api";
import { Unrecognized } from "@Background/background";
import type { VaporLensResponse } from "@Content/Features/Store/App/VaporLens.types";

export default class VaporLensApi extends Api implements MessageHandlerInterface {
    constructor() {
        super("https://vaporlens.app/");
    }

    private fetchInsights(appid: number): Promise<VaporLensResponse> {
        const url = this.getUrl(`api/app/${appid}`);
        return this.fetchJson<VaporLensResponse>(url, {
            credentials: "omit",
            headers: {
                Accept: "application/json",
            },
        });
    }

    handle(message: any): typeof Unrecognized | Promise<any> {
        switch (message.action) {
            case EAction.VaporLens:
                return this.fetchInsights(message.params.appid);
        }

        return Unrecognized;
    }
}
