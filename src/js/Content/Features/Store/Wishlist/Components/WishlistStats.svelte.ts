import {
    CStoreBrowse_GetItems_Request,
    StoreBrowse,
    StoreBrowseContext,
    StoreBrowseItemDataRequest,
    StoreItem,
    StoreItemID
} from "@Protobufs/Compiled/proto.bundle";
import type {WishlistEntry} from "@Content/Features/Store/Wishlist/CWishlist";
import type UserInterface from "@Core/User/UserInterface";
import type Language from "@Core/Localization/Language";
import ServiceFactory, {EOrigin} from "@Protobufs/ServiceFactory";
import ProtobufUtils from "@Protobufs/ProtobufUtils";

export default class WishlistStats {

    readonly #pageSize = 50;

    #wishlistData: WishlistEntry[];

    count: number = $state(0);
    totalPrice: number = $state(0);
    onSaleCount: number = $state(0);
    noPriceCount: number = $state(0);
    hiddenApps: StoreItem.$Properties[] = $state([]);

    loaded: boolean = false;
    #promise: Promise<void>|null = null;

    readonly #service: StoreBrowse;
    readonly #context: StoreBrowseContext;
    readonly #dataRequest: StoreBrowseItemDataRequest;

    constructor(wishlistData: WishlistEntry[], user: UserInterface, language: Language) {
        this.#wishlistData = wishlistData;
        this.count = wishlistData.length;

        this.#service = ServiceFactory.StoreBrowseService(user, EOrigin.Store);

        this.#context = new StoreBrowseContext({
            countryCode: user.storeCountry,
            language: language.name,
            steamRealm: 1
        });

        this.#dataRequest = new StoreBrowseItemDataRequest({
            includeBasicInfo: true
        });
    }

    async load(): Promise<void> {
        this.#promise ??= (async (): Promise<void> => {
            const ids = this.#wishlistData.map(item => new StoreItemID({
                appid: item.appid
            })) ?? [];

            for (let offset: number= 0; offset < this.count; offset += this.#pageSize) {
                const chunk: StoreItemID[] = ids.slice(offset, offset + this.#pageSize);
                if (chunk.length === 0) {
                    break;
                }

                const page = await this.#service.getItems(new CStoreBrowse_GetItems_Request({
                    context: this.#context,
                    dataRequest: this.#dataRequest,
                    ids: chunk
                }));

                for (const item of page.storeItems) {
                    const option = item.bestPurchaseOption;
                    if (!option) {
                        if (!item.visible) {
                            this.hiddenApps.push(item);
                        } else {
                            this.noPriceCount++;
                        }
                        continue;
                    }

                    const finalPrice = ProtobufUtils.getNumber(option.finalPriceInCents) ?? 0;
                    const discount = ProtobufUtils.getNumber(option.discountPct) ?? 0;

                    this.totalPrice += finalPrice;

                    if (discount > 0) {
                        this.onSaleCount++;
                    }
                }
            }
        })();

        return this.#promise;
    }
}