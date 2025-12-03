import { EAction } from "@Background/EAction";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import Api from "@Background/Modules/Api";
import { Unrecognized } from "@Background/background";
import type { TVaporLensResponse } from "@Background/Modules/VaporLens/_types";

export default class VaporLensApi extends Api implements MessageHandlerInterface {

    private readonly cache: Map<number, any>;

    constructor() {
        super("https://vaporlens.app/");
        this.cache = new Map();
    }

    private fetchInsights(appid: number): Promise<TVaporLensResponse|null> {
        const url = this.getUrl(`api/app/${appid}`);

        if (this.cache.has(appid)) {
            // TODO expiry, 12 hrs
            return this.cache.get(appid);
        }

        const response = this.fetchJson<TVaporLensResponse>(url, {
            credentials: "omit",
            headers: {
                Accept: "application/json",
            },
        });
        this.cache.set(appid, response);

        return response;
    }

    handle(message: any): typeof Unrecognized | Promise<any> {
        switch (message.action) {
            case EAction.VaporLens_FetchInsights:
                return this.fetchInsights(message.params.appid);
        }

        return Unrecognized;
    }
}
