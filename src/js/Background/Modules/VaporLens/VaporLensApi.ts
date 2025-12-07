import { EAction } from "@Background/EAction";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import Api from "@Background/Modules/Api";
import { Unrecognized } from "@Background/background";
import type {TVaporLensEntry, TVaporLensResponse} from "@Background/Modules/VaporLens/_types";
import {z} from "zod";
import Errors from "@Core/Errors/Errors";

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

        let data: TVaporLensResponse|null;
        try {
            const response = await this.fetchJson<TVaporLensResponse>(url, {
                credentials: "omit",
                headers: {
                    Accept: "application/json",
                },
            });

            const entrySchema = z.object({
                point: z.string(),
                explanation: z.union([z.string(), z.null()]).optional(),
                importance: z.union([z.number().min(0).max(1), z.null()]).optional()
            });

            const schema = z.object({
                name: z.string().optional(),
                categories: z.array(z.string()).optional(),
                summary: z.array(z.string()).optional(),
                positives: z.array(entrySchema).optional(),
                negatives: z.array(entrySchema).optional(),
                gameplay: z.array(entrySchema).optional(),
                performance: z.array(entrySchema).optional(),
                recommendations: z.array(entrySchema).optional(),
                general: z.array(entrySchema).optional(),
                misc: z.array(entrySchema).optional()
            });

            data = schema.parse(response) as TVaporLensResponse;
        } catch (e) {
            if (!(e instanceof Errors.HTTPError) || e.code !== 404) {
                console.error(e);
            }
            data = null;
        }
        this.cache.set(appid, {
            timestamp: Date.now(),
            data
        });

        return data;
    }

    handle(message: any): typeof Unrecognized | Promise<any> {
        switch (message.action) {
            case EAction.VaporLens_FetchInsights:
                return this.fetchInsights(message.params.appid);
        }

        return Unrecognized;
    }
}
