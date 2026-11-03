import ServiceFactory from "@Protobufs/ServiceFactory";
import type {CStoreBrowse_GetItems_Response} from "@Protobufs/Compiled/proto.bundle";
import FRegionalPricing, {type TPriceMap} from "@Content/Features/Store/Common/FRegionalPricing";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FRegionalPricingApp extends FRegionalPricing<CApp> {

    override async getPriceMap(countries: string[]): Promise<TPriceMap> {

        // [packageid][country] = price
        const priceMap: TPriceMap = new Map();

        await Promise.all(countries.map(async country => {
            const data: CStoreBrowse_GetItems_Response = await ServiceFactory.StoreBrowseService(this.context.user).getItems({
                context: {
                    language: this.context.language?.name ?? "english",
                    countryCode: country,
                    steamRealm: 1
                },
                dataRequest: {
                    includeAllPurchaseOptions: true
                },
                ids: [{appid: this.context.appid}]
            });

            for (const item of data.storeItems) {
                for (const option of item.purchaseOptions ?? []) {
                    if (!option.packageid) { continue; }

                    if (!priceMap.has(option.packageid)) {
                        priceMap.set(option.packageid, new Map());
                    }
                    priceMap.get(option.packageid)!.set(country, option);
                }
            }
        }));

        return priceMap;
    }
}
