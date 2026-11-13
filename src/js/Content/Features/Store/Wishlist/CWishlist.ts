import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import ContextType from "@Content/Modules/Context/ContextType";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import SteamFacade from "@Content/Facades/SteamFacade";
import {WishlistDOM} from "@Content/Features/Store/Wishlist/Utils/WishlistDOM";
import type {TReactQueryData} from "@Content/Features/_types";
import Long from "long";
import ServiceFactory from "@Protobufs/ServiceFactory";
import ASEventHandler from "@Content/Modules/Events/ASEventHandler";
import FWishlistRestorePriceCut from "@Content/Features/Store/Wishlist/FWishlistRestorePriceCut";
import {bootstrapReact, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FAlternativeLinuxIcon from "@Content/Features/Store/Common/FAlternativeLinuxIcon";
import storeFeatures from "@Content/Features/Store/storeFeatures";

export interface WishlistEntry {
    appid: number,
    priority: number,
    added: number,
}

export default class CWishlist extends Context {

    dom: WishlistDOM;

    // @ts-expect-error Initialized in setup()
    ownerId: string;
    // @ts-expect-error Initialized in setup()
    wishlistData: WishlistEntry[];

    readonly onReorder: ASEventHandler<void> = new ASEventHandler<void>();

    constructor(params: ContextParams) {
        super(params);
        this.dom = new WishlistDOM();
    }

    async setup(): Promise<void> {
        const queryData: TReactQueryData = JSON.parse(await SteamFacade.global("SSR.renderContext.queryData"));

        let ownerId: string|null = null;
        let wishlistData: WishlistEntry[]|null = null;

        for (let query of queryData.queries) {
            if (query.queryKey[0] === "WishlistSortedFiltered") {
                ownerId = query.state.data.steamid;
                wishlistData = query.state.data.items;
            }
        }

        if (!ownerId || !wishlistData) {
            throw new Error("Couldn't initialize wishlist, didn't find owner");
        }

        this.ownerId = ownerId;
        this.wishlistData = wishlistData;
        this.dom.observe();
    }

    public get isMyWishlist(): boolean {
        return this.ownerId === this.user.steamId;
    }

    private async reloadWishlistData(): Promise<void> {
        const wishlist = await ServiceFactory.WishlistService(this.user).getWishlist({
            steamid: Long.fromString(this.ownerId!)
        });
        this.wishlistData = wishlist.items.map(item => {
            return {
                appid: item.appid!,
                priority: item.priority!,
                added: item.dateAdded!
            }
        });
    }
}


/**
 * @contentScripts
 * @match *://*.steampowered.com/wishlist
 * @match *://*.steampowered.com/wishlist/(id|profiles)/*
 * @match *://*.steampowered.com//wishlist
 * @match *://*.steampowered.com//wishlist/(id|profiles)/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapReact();
    const context = new CWishlist(params);
    await context.setup();

    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FWishlistHighlights,
        FWishlistITADPrices,
        FWishlistUserNotes,
        FWishlistStats,
        FEmptyWishlist,
        FExportWishlist,
        FWishlistRestorePriceCut
    ]);
}