import { EAction } from "@Background/EAction";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import Api from "@Background/Modules/Api";
import { Unrecognized } from "@Background/background";
import type { TVaporLensResponse } from "@Background/Modules/VaporLens/_types";

export default class VaporLensApi extends Api implements MessageHandlerInterface {

    private readonly cache: Map<number, {timestamp: number, data: TVaporLensResponse|null}>;

    constructor() {
        super("https://vaporlens.app/");
        this.cache = new Map();
    }

    private async fetchInsights(appid: number): Promise<TVaporLensResponse|null> {
        const url = this.getUrl(`api/app/${appid}`);

        if (this.cache.has(appid)) {
            const {timestamp, data} = this.cache.get(appid)!;
            if (timestamp < Date.now() - 12*86400*1000) {
                this.cache.delete(appid);
            } else {
                return data;
            }
        }

        let response: TVaporLensResponse|null;
        try {
            response = await this.fetchJson<TVaporLensResponse>(url, {
                credentials: "omit",
                headers: {
                    Accept: "application/json",
                },
            });
        } catch {
            response = null;
        }
        this.cache.set(appid, {
            timestamp: Date.now(),
            data: response
        });

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
