import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import FWishlistProfileLink from "./FWishlistProfileLink";
import ContextType from "@Content/Modules/Context/ContextType";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import {WishlistDOM} from "@Content/Features/Store/Wishlist/Utils/WishlistDOM";
import type {TReactQueryData} from "@Content/Features/_types";

export interface WishlistEntry {
    appid: number,
    added: number
}

export default class CWishlist extends Context {

    public readonly dom: WishlistDOM;
    public readonly ownerId: string;

    public wishlistData: WishlistEntry[];

    static override async create(params: ContextParams): Promise<CWishlist> {

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

        return new CWishlist(params, ownerId, wishlistData);
    }

    /* TODO private */ constructor(params: ContextParams, ownerId: string, wishlistData: WishlistEntry[]) {
        super(params, ContextType.WISHLIST, [
            FAlternativeLinuxIcon,
            FWishlistHighlights,
            FWishlistITADPrices,
            FWishlistUserNotes,
            FWishlistStats,
            FEmptyWishlist,
            FExportWishlist,
            FWishlistProfileLink,
        ]);

        this.ownerId = ownerId;
        this.wishlistData = wishlistData;
        this.dom = new WishlistDOM();

        this.dom.observe();
    }

    public get isMyWishlist(): boolean {
        return this.ownerId === this.user.steamId;
    }
}
